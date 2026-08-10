"use server";

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

type CafeRole = "admin" | "cashier";
type OrderInputItem = { id?: unknown; quantity?: unknown };
type PricedProduct = {
  id: string;
  name_ar: string | null;
  name_en: string | null;
  name_fr: string | null;
  price: string | number;
};
type ProductMutationData = Record<string, unknown> & { cafe_id?: string };

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unexpected error";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 12,
  path: "/",
};

const getAuthSecret = () =>
  process.env.AUTH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "cafeqr-dev-secret";

const signPayload = (payload: string) =>
  createHmac("sha256", getAuthSecret()).update(payload).digest("hex");

const getRoleCookieName = (role: CafeRole, cafeId: string) => `cafeqr_${role}_${cafeId}`;

const getRolePayload = (role: CafeRole, cafeId: string, email?: string) =>
  role === "admin"
    ? `${role}:${cafeId}:${email?.toLowerCase() || ""}`
    : `${role}:${cafeId}`;

const createSignedCookieValue = (payload: string) => `${payload}.${signPayload(payload)}`;

const isValidSignedCookieValue = (value: string | undefined, payload: string) => {
  if (!value) return false;

  const [rawPayload, signature] = value.split(".");
  if (rawPayload !== payload || !signature) return false;

  const expectedSignature = signPayload(payload);
  const actual = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  return actual.length === expected.length && timingSafeEqual(actual, expected);
};

async function setRoleCookie(role: CafeRole, cafeId: string, email?: string) {
  const cookieStore = await cookies();
  const payload = getRolePayload(role, cafeId, email);

  cookieStore.set(
    getRoleCookieName(role, cafeId),
    createSignedCookieValue(payload),
    cookieOptions
  );
}

async function hasRoleCookie(role: CafeRole, cafeId: string, email?: string) {
  const cookieStore = await cookies();
  const payload = getRolePayload(role, cafeId, email);
  const value = cookieStore.get(getRoleCookieName(role, cafeId))?.value;

  return isValidSignedCookieValue(value, payload);
}

async function assertAdminCafeAccess(cafeId: string) {
  const { data: cafe, error } = await supabaseAdmin
    .from("cafes")
    .select("id, owner_email")
    .eq("id", cafeId)
    .single();

  if (error || !cafe?.owner_email) throw new Error("UNAUTHORIZED_ADMIN");

  const isAllowed = await hasRoleCookie("admin", cafe.id, cafe.owner_email);
  if (!isAllowed) throw new Error("UNAUTHORIZED_ADMIN");

  return cafe;
}

async function assertCashierCafeAccess(cafeId: string) {
  const isAllowed = await hasRoleCookie("cashier", cafeId);
  if (!isAllowed) throw new Error("UNAUTHORIZED_CASHIER");
}

function normalizeOrderItems(items: unknown) {
  if (!Array.isArray(items)) return [];

  return items
    .map((item: OrderInputItem) => ({
      id: String(item?.id || ""),
      quantity: Math.max(1, Math.min(99, Number(item?.quantity || 1))),
    }))
    .filter((item) => item.id);
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

async function getActiveOrdersForCafe(cafeId: string) {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*, tables(table_number)")
    .eq("cafe_id", cafeId)
    .neq("status", "completed")
    .neq("status", "rejected")
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function signInAdminWithEmail(email: string, password: string) {
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { success: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
  }

  const { data: cafeData, error: cafeErr } = await supabaseAdmin
    .from("cafes")
    .select("id, name, slug, owner_email, plan_type")
    .eq("owner_email", email)
    .single();

  if (cafeErr || !cafeData) {
    return { success: false, error: "لم يتم العثور على مقهى مرتبط بهذا الحساب" };
  }

  await setRoleCookie("admin", cafeData.id, cafeData.owner_email);

  return {
    success: true,
    session: data.session,
    user: data.user,
    cafe: cafeData,
  };
}

export async function signUpNewCafe(
  email: string,
  password: string,
  cafeName: string,
  cafeSlug: string
) {
  const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authErr || !authData.user) {
    return { success: false, error: authErr?.message || "فشل إنشاء الحساب" };
  }

  const { error: dbErr } = await supabaseAdmin.from("cafes").insert([
    {
      name: cafeName,
      slug: cafeSlug,
      owner_email: email,
      owner_auth_id: authData.user.id,
      plan_type: "silver", 
      billing_cycle: "monthly",
      subscription_status: "pending_verification",
      max_cashiers: 1,
      max_tables: 30,
      max_menu_items: 150,
      is_white_label: false
    },
  ]);

  if (dbErr) {
    return { success: false, error: "فشل إعداد ملف المقهى في قاعدة البيانات" };
  }

  return { success: true };
}

export async function sendRecoveryEmail(email: string) {
  const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/callback?next=/admin/reset-password`,
  });

  return { success: !error, error: error?.message };
}

export async function verifyPin(cafeId: string, role: "admin" | "cashier", pin: string) {
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (role === "cashier") {
    const { data, error } = await supabaseAdmin
      .from("cafes")
      .select("cashier_pin, subscription_status")
      .eq("id", cafeId)
      .single();

    if (error || !data || data.subscription_status === "suspended") return false;

    const isValid = pin === data.cashier_pin;
    if (isValid) await setRoleCookie("cashier", cafeId);
    return isValid;
  }

  const { data, error } = await supabaseAdmin
    .from("cafes")
    .select("admin_pin")
    .eq("id", cafeId)
    .single();

  if (error || !data) return false;
  return pin === data.admin_pin;
}

export async function verifyOtpAndUpdatePins(
  email: string,
  otp: string,
  cafeId: string,
  newAdminPin: string,
  newCashierPin: string
) {
  const { error: otpError } = await supabaseAdmin.auth.verifyOtp({
    email,
    token: otp,
    type: "recovery",
  });

  if (otpError) {
    return { success: false, error: "رمز التحقق غير صحيح أو منتهي الصلاحية" };
  }

  const { error: updateError } = await supabaseAdmin
    .from("cafes")
    .update({ admin_pin: newAdminPin, cashier_pin: newCashierPin })
    .eq("id", cafeId);

  if (updateError) {
    return { success: false, error: "حدث خطأ أثناء تحديث الرموز" };
  }

  return { success: true };
}

export async function updateCafeSettings(
  cafeId: string,
  name: string,
  adminPin: string,
  cashierPin: string,
  maxCashiers: number,
  kitchenParam: number 
) {
  try {
    const updates: any = {
      name: name,
    };

    if (adminPin && adminPin.trim() !== "") {
      updates.admin_pin = adminPin;
    }
    
    if (cashierPin && cashierPin.trim() !== "") {
      updates.cashier_pin = cashierPin;
    }

    const { error } = await supabaseAdmin
      .from("cafes")
      .update(updates)
      .eq("id", cafeId);

    if (error) {
      console.error("Supabase Update Settings Error:", error);
      throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error("Update Settings Catch Error:", error);
    return { success: false, error: error?.message || "Server Error" };
  }
}

export async function adminAddProduct(productData: any) {
  try {
    if (!productData?.cafe_id) throw new Error("Missing cafe id");

    const { data: cafe } = await supabaseAdmin
      .from("cafes")
      .select("max_menu_items")
      .eq("id", productData.cafe_id)
      .single();

    if (cafe && cafe.max_menu_items < 9999) {
      const { count } = await supabaseAdmin
        .from("products")
        .select("*", { count: 'exact', head: true })
        .eq("cafe_id", productData.cafe_id);

      if (count !== null && count >= cafe.max_menu_items) {
        return { success: false, error: `لقد وصلت للحد الأقصى المسموح به للمنتجات (${cafe.max_menu_items}). يرجى ترقية باقتك لإضافة المزيد.` };
      }
    }

    const { error } = await supabaseAdmin.from("products").insert([productData]);
    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error("Add Product Error:", error);
    return { success: false, error: error?.message || "Server Error" };
  }
}

export async function adminUpdateProduct(id: string, productData: Record<string, unknown>) {
  try {
    const { data: product, error: fetchError } = await supabaseAdmin
      .from("products")
      .select("cafe_id")
      .eq("id", id)
      .single();

    if (fetchError || !product) throw fetchError || new Error("Product not found");

    const { error } = await supabaseAdmin.from("products").update(productData).eq("id", id);
    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error("Update Product Error:", error);
    return { success: false, error: error?.message || "Server Error" };
  }
}

export async function adminDeleteProduct(id: string) {
  try {
    const { data: product, error: fetchError } = await supabaseAdmin
      .from("products")
      .select("cafe_id")
      .eq("id", id)
      .single();

    if (fetchError || !product) throw fetchError || new Error("Product not found");

    const { error } = await supabaseAdmin.from("products").delete().eq("id", id);
    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error("Delete Product Error:", error);
    return { success: false, error: error?.message || "Server Error" };
  }
}

export async function cashierUpdateOrderStatus(orderId: string, status: string) {
  const allowedStatuses = ["pending", "accepted", "ready", "completed", "rejected", "cancelled"];
  if (!allowedStatuses.includes(status)) {
    return { success: false, error: "Invalid status" };
  }

  try {
    const { data: order, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("cafe_id")
      .eq("id", orderId)
      .single();

    if (fetchError || !order) throw fetchError || new Error("Order not found");
    await assertCashierCafeAccess(order.cafe_id);
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabaseAdmin.from("orders").update({ status }).eq("id", orderId);
  return { success: !error, error: error?.message };
}

export async function cashierMarkOutOfStock(productId: string) {
  try {
    const { data: product, error: fetchError } = await supabaseAdmin
      .from("products")
      .select("cafe_id")
      .eq("id", productId)
      .single();

    if (fetchError || !product) throw fetchError || new Error("Product not found");
    await assertCashierCafeAccess(product.cafe_id);
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabaseAdmin
    .from("products")
    .update({ is_active: false })
    .eq("id", productId);

  return { success: !error, error: error?.message };
}

export async function adminCheckOrAddTable(cafeId: string, tableNumber: string) {
  try {
    const token = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (token.includes('.')) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log("🚨 TRUTH SERUM - Server is currently acting as:", payload.role);
    }
    
    const { data: existing, error: selectError } = await supabaseAdmin
      .from("tables")
      .select("id")
      .eq("cafe_id", cafeId)
      .eq("table_number", tableNumber)
      .maybeSingle();

    if (selectError) {
      console.error("Supabase Select Error:", selectError);
      throw new Error(selectError.message);
    }

    if (existing) return { success: true };

    const { data: cafe } = await supabaseAdmin
      .from("cafes")
      .select("max_tables")
      .eq("id", cafeId)
      .single();

    if (cafe && cafe.max_tables < 9999) {
      const { count } = await supabaseAdmin
        .from("tables")
        .select("*", { count: 'exact', head: true })
        .eq("cafe_id", cafeId);

      if (count !== null && count >= cafe.max_tables) {
        return { success: false, error: `لقد وصلت للحد الأقصى للطاولات (${cafe.max_tables}). يرجى ترقية الباقة لإضافة طاولات جديدة.` };
      }
    }

    const { error: insertError } = await supabaseAdmin
      .from("tables")
      .insert([{ cafe_id: cafeId, table_number: tableNumber }]);

    if (insertError) {
      console.error("Supabase Insert Error ❌:", insertError);
      throw new Error(insertError.message);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Table Error Caught 🚨:", error?.message || error);
    return { success: false, error: error?.message || "Unexpected error" };
  }
}

// 🌟 تحديث مهم: تم إضافة subscription_ends_at و subscription_status إلى الاستعلام
export async function getAdminCafeBySlug(cafeSlug: string) {
  const { data, error } = await supabaseAdmin
    .from("cafes")
    .select("id, name, slug, owner_email, plan_type, billing_cycle, max_cashiers, max_tables, max_menu_items, is_white_label, subscription_ends_at, subscription_status")
    .eq("slug", cafeSlug)
    .single();

  if (error || !data) {
    return { success: false, error: "not_found" };
  }

  return { success: true, cafe: data };
}

export async function hasAdminCafeAccess(cafeId: string) {
  try {
    await assertAdminCafeAccess(cafeId);
    return true;
  } catch {
    return false;
  }
}

export async function getAdminProducts(cafeId: string) {
  try {
    await assertAdminCafeAccess(cafeId);

    const { data, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("cafe_id", cafeId);

    if (error) throw error;
    return { success: true, products: data || [] };
  } catch (error: unknown) {
    return { success: false, products: [], error: getErrorMessage(error) };
  }
}

export async function getAdminMonthlySales(cafeId: string) {
  try {
    await assertAdminCafeAccess(cafeId);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*, tables(table_number)")
      .eq("cafe_id", cafeId)
      .eq("status", "completed")
      .gte("created_at", startOfMonth)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, orders: data || [] };
  } catch (error: unknown) {
    return { success: false, orders: [], error: getErrorMessage(error) };
  }
}

export async function getCashierCafeBySlug(cafeSlug: string) {
  const { data, error } = await supabaseAdmin
    .from("cafes")
    .select("id, plan_type, max_cashiers, is_white_label") 
    .eq("slug", cafeSlug)
    .single();

  if (error || !data) {
    return { success: false, error: "not_found" };
  }

  return { success: true, cafe: data };
}

export async function getCashierActiveOrders(cafeId: string) {
  try {
    await assertCashierCafeAccess(cafeId);
    const orders = await getActiveOrdersForCafe(cafeId);

    return { success: true, orders };
  } catch (error: unknown) {
    return { success: false, orders: [], error: getErrorMessage(error) };
  }
}

export async function getCashierWorkspace(cafeId: string) {
  try {
    await assertCashierCafeAccess(cafeId);

    const [productsRes, tablesRes, orders] = await Promise.all([
      supabaseAdmin
        .from("products")
        .select("*")
        .eq("cafe_id", cafeId)
        .eq("is_active", true),
      supabaseAdmin
        .from("tables")
        .select("id, table_number")
        .eq("cafe_id", cafeId),
      getActiveOrdersForCafe(cafeId),
    ]);

    if (productsRes.error) throw productsRes.error;
    if (tablesRes.error) throw tablesRes.error;

    return {
      success: true,
      products: productsRes.data || [],
      tables: tablesRes.data || [],
      orders,
    };
  } catch (error: unknown) {
    return {
      success: false,
      products: [],
      tables: [],
      orders: [],
      error: getErrorMessage(error),
    };
  }
}

export async function createManualCashierOrder(payload: {
  cafeId: string;
  tableId: string;
  sessionId: string;
  items: OrderInputItem[];
}) {
  try {
    await assertCashierCafeAccess(payload.cafeId);

    const { data: table, error: tableError } = await supabaseAdmin
      .from("tables")
      .select("id, table_number")
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
          status: "accepted",
        },
      ])
      .select()
      .single();

    if (error || !data) throw error || new Error("Order insert failed");

    return {
      success: true,
      order: {
        ...data,
        tables: { table_number: table.table_number },
      },
    };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function getAdminTables(cafeId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("tables")
      .select("*")
      .eq("cafe_id", cafeId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, tables: data || [] };
  } catch (error: any) {
    return { success: false, tables: [], error: error?.message || "Error fetching tables" };
  }
}

export async function adminDeleteTable(tableId: string) {
  try {
    const { error: ordersError } = await supabaseAdmin
      .from("orders")
      .delete()
      .eq("table_id", tableId);

    if (ordersError) throw ordersError;

    const { error: tableError } = await supabaseAdmin
      .from("tables")
      .delete()
      .eq("id", tableId);

    if (tableError) throw tableError;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Error deleting table" };
  }
}

export async function loginCashierWithDevice(
  cafeSlug: string, 
  pin: string, 
  deviceId: string, 
  deviceName: string
) {
  const { data: cafe, error: cafeError } = await supabaseAdmin
    .from("cafes")
    .select("id, cashier_pin, subscription_status")
    .eq("slug", cafeSlug)
    .single();

  if (cafeError || !cafe) return { success: false, error: "المقهى غير موجود" };
  if (cafe.subscription_status === "suspended") return { success: false, error: "الاشتراك معلق" };
  if (cafe.cashier_pin !== pin) return { success: false, error: "الرمز السري غير صحيح" };

  const { data: device, error: deviceError } = await supabaseAdmin
    .from("pos_devices")
    .select("*")
    .eq("cafe_id", cafe.id)
    .eq("device_id", deviceId)
    .maybeSingle();

  if (deviceError && deviceError.code !== 'PGRST116') {
    console.error("🚨 Supabase Select Error:", deviceError);
  }

  if (!device) {
    const { error: insertError } = await supabaseAdmin.from("pos_devices").insert([{
      cafe_id: cafe.id,
      device_id: deviceId,
      device_name: deviceName,
      status: 'pending'
    }]);

    if (insertError) {
      console.error("🚨 Database Insert Failed! Table might not exist:", insertError);
      return { success: false, error: `فشل الحفظ في قاعدة البيانات: ${insertError.message}` };
    }

    return { success: false, status: 'pending', error: "تم تسجيل جهازك. يرجى انتظار موافقة الإدارة." };
  }

  if (device.status === 'blocked') {
    return { success: false, status: 'blocked', error: "تم حظر هذا الجهاز من قبل الإدارة ⛔" };
  }

  if (device.status === 'pending') {
    return { success: false, status: 'pending', error: "جهازك قيد المراجعة. يرجى انتظار موافقة الإدارة ⏳" };
  }

  if (device.status === 'approved') {
    await supabaseAdmin.from("pos_devices").update({ last_active: new Date().toISOString() }).eq("id", device.id);
    
    await setRoleCookie("cashier", cafe.id);
    return { success: true, cafeId: cafe.id };
  }

  return { success: false, error: "حالة الجهاز غير معروفة" };
}

export async function getAdminPosDevices(cafeId: string) {
  try {
    await assertAdminCafeAccess(cafeId);

    const { data, error } = await supabaseAdmin
      .from("pos_devices")
      .select("*")
      .eq("cafe_id", cafeId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, devices: data || [] };
  } catch (error: any) {
    return { success: false, devices: [], error: error?.message };
  }
}

export async function updateDeviceStatus(cafeId: string, deviceId: string, newStatus: 'approved' | 'blocked' | 'pending') {
  try {
    if (newStatus === 'approved') {
      const { data: cafe } = await supabaseAdmin
        .from("cafes")
        .select("max_cashiers")
        .eq("id", cafeId)
        .single();

      let maxAllowed = cafe?.max_cashiers || 1;

      const { count } = await supabaseAdmin
        .from("pos_devices")
        .select("*", { count: "exact", head: true })
        .eq("cafe_id", cafeId)
        .eq("status", "approved");

      if (count !== null && count >= maxAllowed) {
        return { 
          success: false, 
          error: `لقد استهلكت جميع الأجهزة المتاحة (${maxAllowed}). قم بالترقية أو حظر جهاز قديم أولاً.` 
        };
      }
    }

    const { error } = await supabaseAdmin
      .from("pos_devices")
      .update({ status: newStatus })
      .eq("id", deviceId)
      .eq("cafe_id", cafeId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message };
  }
}

export async function deletePosDevice(cafeId: string, deviceId: string) {
  try {
    const { error } = await supabaseAdmin
      .from("pos_devices")
      .delete()
      .eq("id", deviceId)
      .eq("cafe_id", cafeId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message };
  }
}