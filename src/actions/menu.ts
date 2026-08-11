"use server";

import { createClient } from "@supabase/supabase-js";
import { unstable_cache, revalidatePath, unstable_noStore as noStore } from "next/cache";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

type OrderInputItem = { id?: unknown; quantity?: unknown };
type PricedProduct = {
  id: string;
  name_ar: string | null;
  name_en: string | null;
  name_fr: string | null;
  price: string | number;
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unexpected error";

function normalizeOrderItems(items: unknown) {
  if (!Array.isArray(items)) return [];

  return items
    .map((item: OrderInputItem) => ({
      id: String(item?.id || ""),
      quantity: Math.max(1, Math.min(99, Number(item?.quantity || 1))),
    }))
    .filter((item) => item.id);
}

async function assertCafeCanAcceptOrders(cafeId: string) {
  const { data: cafe, error } = await supabaseAdmin
    .from("cafes")
    .select("id, subscription_status, subscription_ends_at")
    .eq("id", cafeId)
    .single();

  if (error || !cafe) throw new Error("CAFE_NOT_FOUND");

  const endsAt = cafe.subscription_ends_at
    ? new Date(cafe.subscription_ends_at)
    : new Date(0);

  if (cafe.subscription_status === "suspended") {
    throw new Error("CAFE_SUSPENDED");
  }

  if (new Date() > endsAt && cafe.subscription_status !== "pending_verification") {
    throw new Error("CAFE_EXPIRED");
  }
}

async function buildServerPricedOrderItems(cafeId: string, items: OrderInputItem[]) {
  const normalizedItems = normalizeOrderItems(items);
  const productIds = normalizedItems.map((item) => item.id);

  if (productIds.length === 0) {
    throw new Error("EMPTY_ORDER");
  }

  const { data: products, error } = await supabaseAdmin
    .from("products")
    .select("id, name_ar, name_en, name_fr, price")
    .eq("cafe_id", cafeId)
    .eq("is_active", true)
    .in("id", productIds);

  if (error || !products || products.length !== productIds.length) {
    throw new Error("INVALID_ORDER_ITEMS");
  }

  const pricedProducts = products as PricedProduct[];
  const productsById = new Map(pricedProducts.map((product) => [product.id, product]));
  const serverItems = normalizedItems.map((item) => {
    const product = productsById.get(item.id);
    if (!product) throw new Error("INVALID_ORDER_ITEMS");

    return {
      id: product.id,
      name_ar: product.name_ar,
      name_en: product.name_en,
      name_fr: product.name_fr,
      price: Number(product.price),
      quantity: item.quantity,
    };
  });

  const totalAmount = serverItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return { serverItems, totalAmount };
}

export const getCachedCafeMenu = unstable_cache(
  async (cafeSlug: string, tableId: string) => { // 🌟 تم التغيير من tableNumber إلى tableId
    try {
      // 🌟 جلب بيانات المقهى بما فيها الإحداثيات الجغرافية
      const { data: cafe } = await supabaseAdmin
        .from("cafes")
        .select("id, name, latitude, longitude") // 🌟 إضافة latitude و longitude
        .eq("slug", cafeSlug)
        .single();

      if (!cafe) return { error: "cafe_not_found" };

      // 🌟 التحقق من الطاولة عبر الـ UUID (الـ tableId) وليس الرقم المتسلسل
      const { data: table } = await supabaseAdmin
        .from("tables")
        .select("id")
        .eq("cafe_id", cafe.id)
        .eq("id", tableId) // 🌟 تم التغيير للبحث بالـ UUID
        .single();

      if (!table) return { error: "table_not_found", cafe };

      const { data: products } = await supabaseAdmin
        .from("products")
        .select("*")
        .eq("cafe_id", cafe.id)
        .eq("is_active", true);

      return {
        success: true,
        cafe,
        table,
        products: products || [],
      };
    } catch (error) {
      console.error("Cache Fetch Error:", error);
      return { error: "server_error" };
    }
  },
  ["cafe-menu-cache"],
  {
    revalidate: 120,
    tags: ["menu-data"],
  }
);

export async function getClientActiveOrders(cafeId: string, sessionId: string) {
  noStore(); // 🌟 هذا يمنع الكاش ويجلب البيانات الحية للعميل في هاتفه
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*, tables(table_number)')
      .eq('cafe_id', cafeId)
      .eq('session_id', sessionId)
      .neq('status', 'completed')
      .neq('status', 'rejected')
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, orders: data || [] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createClientOrder(payload: {
  cafeId: string;
  tableId: string;
  sessionId: string;
  items: OrderInputItem[];
}) {
  try {
    if (!payload.cafeId || !payload.tableId || !payload.sessionId) {
      throw new Error("Missing order context");
    }

    await assertCafeCanAcceptOrders(payload.cafeId);

    const { data: table, error: tableError } = await supabaseAdmin
      .from("tables")
      .select("id")
      .eq("id", payload.tableId)
      .eq("cafe_id", payload.cafeId)
      .single();

    if (tableError || !table) throw new Error("Invalid table");

    const { serverItems, totalAmount } = await buildServerPricedOrderItems(
      payload.cafeId,
      payload.items
    );

    const { data, error } = await supabaseAdmin
      .from("orders")
      .insert([
        {
          cafe_id: payload.cafeId,
          table_id: payload.tableId,
          session_id: payload.sessionId,
          items: serverItems,
          total_amount: totalAmount,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (error || !data) throw error || new Error("Order insert failed");

    return { success: true, order: data };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function cancelClientOrder(orderId: string, cafeId: string, sessionId: string) {
  try {
    if (!orderId || !cafeId || !sessionId) throw new Error("Missing order context");

    const { data, error } = await supabaseAdmin
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", orderId)
      .eq("cafe_id", cafeId)
      .eq("session_id", sessionId)
      .eq("status", "pending")
      .select("id")
      .single();

    if (error || !data) throw error || new Error("Order cannot be cancelled");

    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) };
  }
}




// أضف هذه الدوال إلى ملف src/actions/menu.ts

export async function getCategories(cafeId: string) {
  const { data, error } = await supabaseAdmin
    .from('menu_categories')
    .select('*')
    .eq('cafe_id', cafeId)
    .order('created_at', { ascending: true });
  return { success: !error, data: data || [], error: error?.message };
}

export async function addCategory(cafeId: string, name_ar: string, name_en: string, name_fr: string, icon: string) {
  const { data, error } = await supabaseAdmin
    .from('menu_categories')
    .insert([{ cafe_id: cafeId, name_ar, name_en, name_fr, icon }])
    .select()
    .single();
  
  if (!error) revalidatePath('/', 'layout');
  return { success: !error, data, error: error?.message };
}

export async function updateCategory(id: string, name_ar: string, name_en: string, name_fr: string, icon: string) {
  const { error } = await supabaseAdmin
    .from('menu_categories')
    .update({ name_ar, name_en, name_fr, icon })
    .eq('id', id);
    
  if (!error) revalidatePath('/', 'layout');
  return { success: !error, error: error?.message };
}

export async function deleteCategory(id: string) {
  const { error } = await supabaseAdmin
    .from('menu_categories')
    .delete()
    .eq('id', id);
    
  if (!error) revalidatePath('/', 'layout');
  return { success: !error, error: error?.message };
}