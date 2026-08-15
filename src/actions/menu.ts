"use server";

import { createClient } from "@supabase/supabase-js";
import { unstable_cache, revalidatePath, unstable_noStore as noStore } from "next/cache";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

type OrderInputItem = { id?: unknown; quantity?: unknown; modifiers?: Record<string, number> };
type PricedProduct = {
  id: string;
  name_ar: string | null;
  name_en: string | null;
  name_fr: string | null;
  price: string | number;
  product_modifiers?: any[];
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unexpected error";

function normalizeOrderItems(items: unknown) {
  if (!Array.isArray(items)) return [];

  return items
    .map((item: any) => ({
      product_id: String(item?.product_id || item?.id || ""),
      cart_id: String(item?.id || ""),
      quantity: Math.max(1, Math.min(99, Number(item?.quantity || 1))),
      client_price: Number(item?.price || 0),
      client_name_ar: String(item?.name_ar || ""),
      client_name_en: String(item?.name_en || ""),
      client_name_fr: String(item?.name_fr || ""),
      modifiers: typeof item?.modifiers === 'object' && item.modifiers !== null ? item.modifiers : {},
    }))
    .filter((item) => item.product_id);
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

export async function buildServerPricedOrderItems(cafeId: string, items: any[]) {
  const normalizedItems = normalizeOrderItems(items);
  const productIds = normalizedItems.map((item) => item.product_id);

  if (productIds.length === 0) throw new Error("EMPTY_ORDER");

  const { data: products, error } = await supabaseAdmin
    .from("products")
    .select("id, name_ar, name_en, name_fr, price")
    .eq("cafe_id", cafeId)
    .eq("is_active", true)
    .in("id", productIds);

  if (error || !products) throw new Error("INVALID_ORDER_ITEMS");

  const productsById = new Map(products.map((p) => [p.id, p]));

  const serverItems = normalizedItems.map((item) => {
    const product = productsById.get(item.product_id);
    if (!product) throw new Error("INVALID_ORDER_ITEMS");

    return {
      id: item.cart_id, 
      product_id: product.id,
      // تمرير الاسم القادم من العميل لاحتوائه على نصوص الإضافات
      name_ar: item.client_name_ar || product.name_ar,
      name_en: item.client_name_en || product.name_en,
      name_fr: item.client_name_fr || product.name_fr,
      // الاعتماد على السعر المحدث الخاص بالعميل (الذي يشمل ثمن الإضافات)
      price: item.client_price > 0 ? item.client_price : Number(product.price),
      quantity: item.quantity,
      modifiers: item.modifiers
    };
  });

  // 🌟 هذه هي الأسطر التي كانت مفقودة وتسببت في الخطأ
  const totalAmount = serverItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return { serverItems, totalAmount };
}

export const getCachedCafeMenu = unstable_cache(
  async (cafeSlug: string, tableId: string) => {
    try {
      const { data: cafe } = await supabaseAdmin
        .from("cafes")
        .select("id, name, latitude, longitude")
        .eq("slug", cafeSlug)
        .single();

      if (!cafe) return { error: "cafe_not_found" };

      const { data: table } = await supabaseAdmin
        .from("tables")
        .select("id")
        .eq("cafe_id", cafe.id)
        .eq("id", tableId)
        .single();

      if (!table) return { error: "table_not_found", cafe };

      // Fetch products and their nested modifier relationships
      const { data: products } = await supabaseAdmin
        .from("products")
        .select(`
          *,
          product_modifiers (
            modifier_groups (
              id,
              name_ar,
              name_en,
              name_fr,
              type,
              min_selections,
              max_selections,
              modifier_options (
                id,
                modifier_group_id,
                name_ar,
                name_en,
                name_fr,
                price_adjustment
              )
            )
          )
        `)
        .eq("cafe_id", cafe.id)
        .eq("is_active", true);

      // Transform nested product_modifiers into a flat modifier_groups array
      const formattedProducts = products?.map((p: any) => {
        const { product_modifiers, ...rest } = p;
        const groups = (product_modifiers || [])
          .map((pm: any) => pm.modifier_groups)
          .filter(Boolean);
        return { ...rest, modifier_groups: groups };
      }) || [];

      return {
        success: true,
        cafe,
        table,
        products: formattedProducts,
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
  noStore();
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
  items: any[];
}) {
  try {
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
          items: serverItems, // سيتم إدراج البيانات المحدثة في عمود jsonb هنا
          total_amount: totalAmount,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (error || !data) throw error;

    return { success: true, order: data };
  } catch (error: any) {
    return { success: false, error: error.message };
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

export async function getCategories(cafeId: string) {
  const { data, error } = await supabaseAdmin
    .from('menu_categories')
    .select('*')
    .eq('cafe_id', cafeId)
    .order('created_at', { ascending: true });
  return { success: !error, data: data || [], error: error?.message };
}

export async function addCategory(cafeId: string, name_ar: string, name_en: string, name_fr: string, icon: string, subcategories: string[] = []) {
  const { data, error } = await supabaseAdmin
    .from('menu_categories')
    .insert([{ cafe_id: cafeId, name_ar, name_en, name_fr, icon, subcategories }])
    .select()
    .single();

  if (!error) revalidatePath('/', 'layout');
  return { success: !error, data, error: error?.message };
}

export async function updateCategory(id: string, name_ar: string, name_en: string, name_fr: string, icon: string, subcategories: string[] = []) {
  const { error } = await supabaseAdmin
    .from('menu_categories')
    .update({ name_ar, name_en, name_fr, icon, subcategories })
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