"use server";

import { createClient } from "@supabase/supabase-js";
import { unstable_cache, revalidatePath, unstable_noStore as noStore } from "next/cache";
import { assertAdminCafeAccess } from "./auth"; // 🔒 استيراد التحقق الأمني

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

  // 1. جلب أسعار المنتجات الأساسية
  const { data: products, error } = await supabaseAdmin
    .from("products")
    .select("id, name_ar, name_en, name_fr, price")
    .eq("cafe_id", cafeId)
    .eq("is_active", true)
    .in("id", productIds);

  if (error || !products) throw new Error("INVALID_ORDER_ITEMS");
  const productsById = new Map(products.map((p) => [p.id, p]));

  // 2. استخراج جميع معرّفات الإضافات (modifier_options) المختارة من قبل العميل لحساب سعرها
  const allOptionIds = new Set<string>();
  const extractIds = (val: any) => {
    if (typeof val === 'string' && val.length > 10) allOptionIds.add(val); // افتراض أن المعرّفات هي UUIDs
    else if (Array.isArray(val)) val.forEach(extractIds);
    else if (typeof val === 'object' && val !== null) Object.values(val).forEach(extractIds);
  };
  
  normalizedItems.forEach(item => extractIds(item.modifiers));

  // 3. جلب أسعار الإضافات من قاعدة البيانات لضمان دقتها
  const optionsMap = new Map<string, number>();
  if (allOptionIds.size > 0) {
    const { data: options } = await supabaseAdmin
      .from('modifier_options')
      .select('id, price_adjustment')
      .in('id', Array.from(allOptionIds));
      
    if (options) {
      options.forEach(opt => optionsMap.set(opt.id, Number(opt.price_adjustment || 0)));
    }
  }

  // 4. تجميع الطلب وحساب السعر النهائي بشكل آمن
  const serverItems = normalizedItems.map((item) => {
    const product = productsById.get(item.product_id);
    if (!product) throw new Error("INVALID_ORDER_ITEMS");

    // حساب تكلفة الإضافات لهذا المنتج تحديداً
    let modifiersTotal = 0;
    const calculateModifiers = (val: any) => {
      if (typeof val === 'string' && optionsMap.has(val)) modifiersTotal += optionsMap.get(val)!;
      else if (Array.isArray(val)) val.forEach(calculateModifiers);
      else if (typeof val === 'object' && val !== null) Object.values(val).forEach(calculateModifiers);
    };
    calculateModifiers(item.modifiers);

    // הסعر الآمن = السعر الأساسي للمنتج + تكلفة الإضافات
    const secureCalculatedPrice = Number(product.price) + modifiersTotal;

    return {
      id: item.cart_id, 
      product_id: product.id,
      name_ar: item.client_name_ar || product.name_ar,
      name_en: item.client_name_en || product.name_en,
      name_fr: item.client_name_fr || product.name_fr,
      price: secureCalculatedPrice, // 🔒 استخدام السعر المحسوب في الخادم فقط
      quantity: item.quantity,
      modifiers: item.modifiers
    };
  });

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
    await assertCafeCanAcceptOrders(payload.cafeId); // 🔒 منع الطلب إذا كان المقهى موقوفاً أو انتهى اشتراكه

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
  try {
    await assertAdminCafeAccess(cafeId); // 🔒 حماية

    const { data, error } = await supabaseAdmin
      .from('menu_categories')
      .insert([{ cafe_id: cafeId, name_ar, name_en, name_fr, icon, subcategories }])
      .select()
      .single();

    if (error) throw error;
    
    revalidatePath('/', 'layout');
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error?.message };
  }
}

export async function updateCategory(id: string, name_ar: string, name_en: string, name_fr: string, icon: string, subcategories: string[] = []) {
  try {
    // 🔒 جلب المقهى المرتبط للتحقق من الصلاحيات بدون كسر الواجهة الأمامية
    const { data: cat, error: fetchErr } = await supabaseAdmin.from('menu_categories').select('cafe_id').eq('id', id).single();
    if (fetchErr || !cat) throw new Error("Category not found");
    
    await assertAdminCafeAccess(cat.cafe_id); 

    const { error } = await supabaseAdmin
      .from('menu_categories')
      .update({ name_ar, name_en, name_fr, icon, subcategories })
      .eq('id', id)
      .eq('cafe_id', cat.cafe_id);

    if (error) throw error;

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message };
  }
}

export async function deleteCategory(id: string) {
  try {
    // 🔒 جلب المقهى المرتبط للتحقق من الصلاحيات بدون كسر الواجهة الأمامية
    const { data: cat, error: fetchErr } = await supabaseAdmin.from('menu_categories').select('cafe_id').eq('id', id).single();
    if (fetchErr || !cat) throw new Error("Category not found");
    
    await assertAdminCafeAccess(cat.cafe_id); 

    const { error } = await supabaseAdmin
      .from('menu_categories')
      .delete()
      .eq('id', id)
      .eq('cafe_id', cat.cafe_id);

    if (error) throw error;

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message };
  }
}