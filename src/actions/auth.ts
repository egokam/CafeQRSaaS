"use server";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const superAdminEmail = (
  process.env.SUPER_ADMIN_EMAIL || "elotmanikamal607@gmail.com"
).trim().toLowerCase();

type CafeRole = "admin" | "cashier";
type PosDeviceStatus = "pending" | "approved" | "blocked";
type OrderInputItem = { id?: unknown; quantity?: unknown };
type PricedProduct = {
  id: string;
  name_ar: string | null;
  name_en: string | null;
  name_fr: string | null;
  price: string | number;
};
type ProductMutationData = Record<string, unknown> & { cafe_id?: string };

const PRODUCT_MUTABLE_COLUMNS = [
  "name_ar",
  "name_en",
  "name_fr",
  "description_ar",
  "price",
  "category",
  "category_id",
  "sub_category",
  "image_url",
  "is_active",
] as const;

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unexpected error";

const POS_DEVICE_STATUSES = new Set<PosDeviceStatus>([
  "pending",
  "approved",
  "blocked",
]);

const isValidPosDeviceId = (value: unknown): value is string =>
  typeof value === "string" && /^dev_[a-zA-Z0-9_-]{8,128}$/.test(value);

const isValidPosDeviceName = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0 && value.trim().length <= 200;

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 12,
  path: "/",
};

const getAuthSecret = () =>
  process.env.AUTH_SECRET || supabaseServiceKey;

const signPayload = (payload: string) =>
  createHmac("sha256", getAuthSecret()).update(payload).digest("hex");

const getRoleCookieName = (role: CafeRole, cafeId: string) => `cafeqr_${role}_${cafeId}`;
const superAdminCookieName = "cafeqr_super_admin";

const getRolePayload = (role: CafeRole, cafeId: string, identity?: string) =>
  role === "admin"
    ? `${role}:${cafeId}:${identity?.toLowerCase() || ""}`
    : `${role}:${cafeId}:${identity || ""}`;

const createSignedCookieValue = (payload: string) => `${payload}.${signPayload(payload)}`;

const isValidSignedCookieValue = (value: string | undefined, payload: string) => {
  if (!value) return false;

  // Payloads may contain an email address, and email addresses can contain
  // dots. Split at the final delimiter so the HMAC is read intact.
  const separatorIndex = value.lastIndexOf(".");
  if (separatorIndex <= 0) return false;

  const rawPayload = value.slice(0, separatorIndex);
  const signature = value.slice(separatorIndex + 1);
  if (rawPayload !== payload || !signature) return false;

  const expectedSignature = signPayload(payload);
  const actual = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  return actual.length === expected.length && timingSafeEqual(actual, expected);
};

function sanitizeProductMutation(data: ProductMutationData) {
  const updates: Record<string, unknown> = {};

  for (const column of PRODUCT_MUTABLE_COLUMNS) {
    if (column in data) updates[column] = data[column];
  }

  if (typeof updates.name_ar !== "string" || updates.name_ar.trim() === "") {
    throw new Error("Product name is required");
  }

  const price = Number(updates.price);
  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Product price must be a non-negative number");
  }
  updates.price = price;

  for (const column of [
    "name_en",
    "name_fr",
    "description_ar",
    "category",
    "category_id",
    "sub_category",
    "image_url",
  ]) {
    if (column in updates && updates[column] !== null && typeof updates[column] !== "string") {
      throw new Error(`Invalid ${column}`);
    }
  }

  if ("is_active" in updates && typeof updates.is_active !== "boolean") {
    throw new Error("Invalid is_active value");
  }

  return updates;
}

async function assertModifierGroupsBelongToCafe(cafeId: string, rawModifierIds: unknown) {
  if (!Array.isArray(rawModifierIds)) return [] as string[];

  const modifierIds = [...new Set(rawModifierIds.filter((id): id is string => typeof id === "string"))];
  if (modifierIds.length !== rawModifierIds.length) {
    throw new Error("Invalid modifier group id");
  }
  if (modifierIds.length === 0) return modifierIds;

  const { data, error } = await supabaseAdmin
    .from("modifier_groups")
    .select("id")
    .eq("cafe_id", cafeId)
    .in("id", modifierIds);

  if (error || !data || data.length !== modifierIds.length) {
    throw new Error("One or more modifier groups do not belong to this cafe");
  }

  return modifierIds;
}

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

const getSuperAdminPayload = () => `super_admin:${superAdminEmail}`;

async function setSuperAdminCookie() {
  const cookieStore = await cookies();
  cookieStore.set(
    superAdminCookieName,
    createSignedCookieValue(getSuperAdminPayload()),
    cookieOptions
  );
}

export async function assertSuperAdminAccess() {
  const cookieStore = await cookies();
  const value = cookieStore.get(superAdminCookieName)?.value;

  if (!isValidSignedCookieValue(value, getSuperAdminPayload())) {
    throw new Error("UNAUTHORIZED_SUPER_ADMIN");
  }
}

export async function hasSuperAdminAccess() {
  try {
    await assertSuperAdminAccess();
    return true;
  } catch {
    return false;
  }
}

export async function signOutSuperAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete(superAdminCookieName);
  return { success: true };
}

export async function assertAdminCafeAccess(cafeId: string) {
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

export async function assertCashierCafeAccess(cafeId: string) {
  const cookieStore = await cookies();
  const value = cookieStore.get(getRoleCookieName("cashier", cafeId))?.value;
  const [payload] = value?.split(".") || [];
  const [role, payloadCafeId, deviceId] = payload?.split(":") || [];

  if (
    role !== "cashier" ||
    payloadCafeId !== cafeId ||
    !isValidPosDeviceId(deviceId) ||
    !isValidSignedCookieValue(value, payload)
  ) {
    throw new Error("UNAUTHORIZED_CASHIER");
  }

  const { data: device, error } = await supabaseAdmin
    .from("pos_devices")
    .select("id")
    .eq("cafe_id", cafeId)
    .eq("device_id", deviceId)
    .eq("status", "approved")
    .maybeSingle();

  if (error || !device) throw new Error("UNAUTHORIZED_CASHIER");
}

export async function hasCashierCafeAccess(cafeId: string) {
  try {
    await assertCashierCafeAccess(cafeId);
    return true;
  } catch {
    return false;
  }
}

function normalizeOrderItems(items: unknown) {
  if (!Array.isArray(items)) return [];

  return items
    .map((item: any) => ({
      id: String(item?.product_id || item?.id || ""),
      quantity: Math.max(1, Math.min(99, Number(item?.quantity || 1))),
      modifiers: typeof item?.modifiers === 'object' && item.modifiers !== null ? item.modifiers : {},
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
  // استخدام عميل مؤقت لمنع تلويث ذاكرة الخادم وصلاحيات supabaseAdmin
  const tempAuthClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data, error } = await tempAuthClient.auth.signInWithPassword({
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

  return { success: true, cafe: cafeData };
}

export async function signInSuperAdmin(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail !== superAdminEmail) {
    return { success: false, error: "UNAUTHORIZED_SUPER_ADMIN" };
  }

  const tempAuthClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await tempAuthClient.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error || data.user?.email?.toLowerCase() !== superAdminEmail) {
    return { success: false, error: "INVALID_CREDENTIALS" };
  }

  await setSuperAdminCookie();
  return { success: true };
}

export async function sendSuperAdminOtp(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail !== superAdminEmail) {
    return { success: false, error: "UNAUTHORIZED_SUPER_ADMIN" };
  }

  const { error } = await supabaseAdmin.auth.signInWithOtp({
    email: normalizedEmail,
    options: { shouldCreateUser: false },
  });
  return { success: !error, error: error?.message };
}

export async function verifySuperAdminOtp(email: string, otp: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail !== superAdminEmail) {
    return { success: false, error: "UNAUTHORIZED_SUPER_ADMIN" };
  }

  const tempAuthClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await tempAuthClient.auth.verifyOtp({
    email: normalizedEmail,
    token: otp.trim(),
    type: "email",
  });

  if (error || data.user?.email?.toLowerCase() !== superAdminEmail) {
    return { success: false, error: error?.message || "INVALID_OTP" };
  }

  await setSuperAdminCookie();
  return { success: true };
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

export async function requestAdminPasswordRecovery(cafeId: string, email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const { data: cafe, error: cafeError } = await supabaseAdmin
    .from("cafes")
    .select("id, slug, owner_email")
    .eq("id", cafeId)
    .ilike("owner_email", normalizedEmail)
    .maybeSingle();

  if (cafeError || !cafe) {
    return { success: false, error: "UNAUTHORIZED_ADMIN" };
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const { error } = await supabaseAdmin.auth.resetPasswordForEmail(cafe.owner_email, {
    redirectTo: `${siteUrl}/${cafe.slug}/admin`,
  });

  return { success: !error, error: error?.message };
}

export async function resetAdminPasswordWithOtp(
  cafeId: string,
  email: string,
  otp: string,
  newPassword: string
) {
  const normalizedEmail = email.trim().toLowerCase();
  if (newPassword.length < 8) {
    return { success: false, error: "WEAK_PASSWORD" };
  }

  const { data: cafe, error: cafeError } = await supabaseAdmin
    .from("cafes")
    .select("id, owner_email, owner_auth_id")
    .eq("id", cafeId)
    .ilike("owner_email", normalizedEmail)
    .maybeSingle();

  if (cafeError || !cafe) {
    return { success: false, error: "UNAUTHORIZED_ADMIN" };
  }

  const tempAuthClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error: otpError } = await tempAuthClient.auth.verifyOtp({
    email: normalizedEmail,
    token: otp.trim(),
    type: "recovery",
  });

  if (otpError || !data.user || (cafe.owner_auth_id && data.user.id !== cafe.owner_auth_id)) {
    return { success: false, error: "INVALID_OTP" };
  }

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(data.user.id, {
    password: newPassword,
  });
  return { success: !updateError, error: updateError?.message };
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
    // Cashier workspaces are bound to an approved POS device in
    // loginCashierWithDevice; a PIN alone must not create a reusable session.
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
  // استخدام عميل مؤقت
  const tempAuthClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { error: otpError } = await tempAuthClient.auth.verifyOtp({
    email,
    token: otp,
    type: "recovery",
  });

  if (otpError) {
    return { success: false, error: "رمز التحقق غير صحيح أو منتهي الصلاحية" };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const { data: cafe, error: cafeError } = await supabaseAdmin
    .from("cafes")
    .select("id")
    .eq("id", cafeId)
    .ilike("owner_email", normalizedEmail)
    .maybeSingle();

  if (cafeError || !cafe) {
    return { success: false, error: "غير مصرح بتحديث رموز هذا المقهى" };
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
  kitchenParam: number,
  latitude?: number | null,
  longitude?: number | null
) {
  try {
    await assertAdminCafeAccess(cafeId);

    const updates: any = {
      name: name,
    };

    if (adminPin && adminPin.trim() !== "") {
      updates.admin_pin = adminPin;
    }

    if (cashierPin && cashierPin.trim() !== "") {
      updates.cashier_pin = cashierPin;
    }

    if (latitude !== undefined) updates.latitude = latitude;
    if (longitude !== undefined) updates.longitude = longitude;

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
    const cafeId = String(productData.cafe_id);
    await assertAdminCafeAccess(cafeId);

    const { data: cafe } = await supabaseAdmin
      .from("cafes")
      .select("max_menu_items")
      .eq("id", cafeId)
      .single();

    if (cafe && cafe.max_menu_items < 9999) {
      const { count } = await supabaseAdmin
        .from("products")
        .select("*", { count: 'exact', head: true })
        .eq("cafe_id", cafeId);

      if (count !== null && count >= cafe.max_menu_items) {
        return { success: false, error: `لقد وصلت للحد الأقصى المسموح به للمنتجات (${cafe.max_menu_items}). يرجى ترقية باقتك لإضافة المزيد.` };
      }
    }

    const modifierIds = await assertModifierGroupsBelongToCafe(cafeId, productData.modifier_ids);
    const productInsert = {
      ...sanitizeProductMutation(productData),
      cafe_id: cafeId,
    };

    const { data: insertedProduct, error: productError } = await supabaseAdmin
      .from("products")
      .insert([productInsert])
      .select("id")
      .single();

    if (productError || !insertedProduct) throw productError || new Error("Failed to insert product");

    if (modifierIds.length > 0) {
      const modifierInserts = modifierIds.map((modId: string, index: number) => ({
        product_id: insertedProduct.id,
        modifier_group_id: modId,
        position_order: index
      }));

      const { error: modError } = await supabaseAdmin
        .from("product_modifiers")
        .insert(modifierInserts);

      if (modError) throw modError;
    }

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

    await assertAdminCafeAccess(product.cafe_id);

    const hasModifiersUpdate = 'modifier_ids' in productData;
    const modifierIds = hasModifiersUpdate
      ? await assertModifierGroupsBelongToCafe(product.cafe_id, productData.modifier_ids)
      : [];
    const productUpdate = sanitizeProductMutation(productData);

    const { error: updateError } = await supabaseAdmin
      .from("products")
      .update(productUpdate)
      .eq("id", id);

    if (updateError) throw updateError;

    if (hasModifiersUpdate) {
      const { error: delError } = await supabaseAdmin
        .from("product_modifiers")
        .delete()
        .eq("product_id", id);

      if (delError) throw delError;

      if (modifierIds.length > 0) {
        const modifierInserts = modifierIds.map((modId: string, index: number) => ({
          product_id: id,
          modifier_group_id: modId,
          position_order: index
        }));

        const { error: modError } = await supabaseAdmin
          .from("product_modifiers")
          .insert(modifierInserts);

        if (modError) throw modError;
      }
    }

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

    await assertAdminCafeAccess(product.cafe_id);

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
    await assertAdminCafeAccess(cafeId);

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

    if (existing) return { success: true, tableId: existing.id };

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

    const { data: newTable, error: insertError } = await supabaseAdmin
      .from("tables")
      .insert([{ cafe_id: cafeId, table_number: tableNumber }])
      .select("id")
      .single();

    if (insertError || !newTable) {
      console.error("Supabase Insert Error ❌:", insertError);
      throw new Error(insertError?.message || "فشل في إنشاء الطاولة");
    }

    return { success: true, tableId: newTable.id };
  } catch (error: any) {
    console.error("Table Error Caught 🚨:", error?.message || error);
    return { success: false, error: error?.message || "Unexpected error" };
  }
}

export async function getAdminCafeBySlug(cafeSlug: string) {
  noStore();

  const { data, error, status, statusText } = await supabaseAdmin
    .from("cafes")
    .select("id, name, slug, owner_email, plan_type, billing_cycle, max_cashiers, max_tables, max_menu_items, is_white_label, subscription_ends_at, subscription_status, latitude, longitude")
    .eq("slug", cafeSlug)
    .single();

  if (error || !data) {
    if (error) {
      console.error("[getAdminCafeBySlug] Supabase select failed", {
        cafeSlug,
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        status,
        statusText,
      });
    }

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
      .select("*, product_modifiers(modifier_group_id)")
      .eq("cafe_id", cafeId)
      .order("created_at", { ascending: false });

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
    .select("id, name, plan_type, max_cashiers, is_white_label")
    .eq("slug", cafeSlug)
    .single();

  if (error || !data) {
    return { success: false, error: "not_found" };
  }

  return { success: true, cafe: data };
}

export async function getCashierActiveOrders(cafeId: string) {
  noStore(); 
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
  noStore(); 
  try {
    await assertAdminCafeAccess(cafeId);

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
    const { data: table, error: fetchError } = await supabaseAdmin
      .from("tables")
      .select("cafe_id")
      .eq("id", tableId)
      .single();

    if (fetchError || !table) throw fetchError || new Error("Table not found");

    await assertAdminCafeAccess(table.cafe_id);

    const { error: ordersError } = await supabaseAdmin
      .from("orders")
      .delete()
      .eq("table_id", tableId);

    if (ordersError) {
      console.error("🚨 Error deleting table orders:", ordersError);
      throw ordersError;
    }

    const { error: tableError } = await supabaseAdmin
      .from("tables")
      .delete()
      .eq("id", tableId);

    if (tableError) {
      console.error("🚨 Error deleting table:", tableError);
      throw tableError;
    }

    revalidatePath('/', 'layout');

    return { success: true };
  } catch (error: any) {
    console.error("🚨 Catch Block - Delete Table Error:", error);
    return { success: false, error: error?.message || "Error deleting table" };
  }
}

export async function loginCashierWithDevice(
  cafeSlug: string,
  pin: string,
  deviceId: string,
  deviceName: string
) {
  if (!isValidPosDeviceId(deviceId)) {
    return { success: false, error: "معرّف الجهاز غير صالح" };
  }
  if (!isValidPosDeviceName(deviceName)) {
    return { success: false, error: "اسم الجهاز غير صالح" };
  }

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

  if (deviceError) {
    console.error("[loginCashierWithDevice] POS device lookup failed", {
      cafeId: cafe.id,
      message: deviceError.message,
      code: deviceError.code,
    });
    return { success: false, error: `فشل التحقق من حالة الجهاز: ${deviceError.message}` };
  }

  if (!device) {
    const { data: insertedDevice, error: insertError } = await supabaseAdmin
      .from("pos_devices")
      .insert({
        cafe_id: cafe.id,
        device_id: deviceId,
        device_name: deviceName.trim(),
        status: "pending",
      })
      .select("id, status")
      .maybeSingle();

    if (insertError) {
      // A duplicate can happen if the user submits twice or two browser tabs
      // register the same locally persisted device at once. Read the scoped
      // row rather than incorrectly reporting a failed registration.
      if (insertError.code === "23505") {
        const { data: existingDevice, error: retryError } = await supabaseAdmin
          .from("pos_devices")
          .select("status")
          .eq("cafe_id", cafe.id)
          .eq("device_id", deviceId)
          .maybeSingle();

        if (!retryError && existingDevice) {
          return {
            success: false,
            status: existingDevice.status as PosDeviceStatus,
            error: "جهازك قيد المراجعة. يرجى انتظار موافقة الإدارة ⏳",
          };
        }
      }

      console.error("[loginCashierWithDevice] POS device registration failed", {
        cafeId: cafe.id,
        message: insertError.message,
        code: insertError.code,
      });
      return { success: false, error: `فشل الحفظ في قاعدة البيانات: ${insertError.message}` };
    }

    if (!insertedDevice) {
      return { success: false, error: "تعذر تأكيد تسجيل الجهاز" };
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
    const { error: activityError } = await supabaseAdmin
      .from("pos_devices")
      .update({ last_active: new Date().toISOString() })
      .eq("id", device.id)
      .eq("cafe_id", cafe.id);

    if (activityError) {
      console.error("[loginCashierWithDevice] POS device activity update failed", {
        cafeId: cafe.id,
        deviceId,
        message: activityError.message,
        code: activityError.code,
      });
      return { success: false, error: `فشل تحديث حالة الجهاز: ${activityError.message}` };
    }

    await setRoleCookie("cashier", cafe.id, deviceId);
    return { success: true, cafeId: cafe.id };
  }

  return { success: false, error: "حالة الجهاز غير معروفة" };
}

/**
 * The unauthenticated cashier needs only its own registration state while it
 * is waiting for approval. This server action keeps the service-role client
 * on the server and scopes the lookup to the supplied cafe slug + device ID.
 */
export async function getCashierDeviceStatus(cafeSlug: string, deviceId: string) {
  noStore();

  if (!isValidPosDeviceId(deviceId)) {
    return { success: false, error: "INVALID_DEVICE_ID" };
  }

  const { data: cafe, error: cafeError } = await supabaseAdmin
    .from("cafes")
    .select("id")
    .eq("slug", cafeSlug)
    .maybeSingle();

  if (cafeError || !cafe) {
    return { success: false, error: "CAFE_NOT_FOUND" };
  }

  const { data: device, error: deviceError } = await supabaseAdmin
    .from("pos_devices")
    .select("status")
    .eq("cafe_id", cafe.id)
    .eq("device_id", deviceId)
    .maybeSingle();

  if (deviceError) {
    console.error("[getCashierDeviceStatus] POS device lookup failed", {
      cafeId: cafe.id,
      message: deviceError.message,
      code: deviceError.code,
    });
    return { success: false, error: "DEVICE_STATUS_LOOKUP_FAILED" };
  }

  if (!device || !POS_DEVICE_STATUSES.has(device.status as PosDeviceStatus)) {
    return { success: true, status: "none" as const };
  }

  return { success: true, status: device.status as PosDeviceStatus };
}

export async function getAdminPosDevices(cafeId: string) {
  noStore(); 
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

export async function updateDeviceStatus(cafeId: string, deviceId: string, newStatus: PosDeviceStatus) {
  try {
    await assertAdminCafeAccess(cafeId);

    if (!POS_DEVICE_STATUSES.has(newStatus)) {
      return { success: false, error: "Invalid device status" };
    }

    const { data: device, error: deviceError } = await supabaseAdmin
      .from("pos_devices")
      .select("id, status")
      .eq("id", deviceId)
      .eq("cafe_id", cafeId)
      .maybeSingle();

    if (deviceError) throw deviceError;
    if (!device) return { success: false, error: "Device not found for this cafe" };

    if (device.status === newStatus) {
      return { success: true, device };
    }

    if (newStatus === 'approved' && device.status !== 'approved') {
      const { data: cafe, error: cafeError } = await supabaseAdmin
        .from("cafes")
        .select("max_cashiers")
        .eq("id", cafeId)
        .single();
      if (cafeError || !cafe) throw cafeError || new Error("Cafe not found");

      const maxAllowed = cafe.max_cashiers || 1;

      const { count, error: countError } = await supabaseAdmin
        .from("pos_devices")
        .select("*", { count: "exact", head: true })
        .eq("cafe_id", cafeId)
        .eq("status", "approved");
      if (countError) throw countError;

      if (count !== null && count >= maxAllowed) {
        return {
          success: false,
          error: `لقد استهلكت جميع الأجهزة المتاحة (${maxAllowed}). قم بالترقية أو حظر جهاز قديم أولاً.`
        };
      }
    }

    const { data: updatedDevice, error } = await supabaseAdmin
      .from("pos_devices")
      .update({ status: newStatus })
      .eq("id", deviceId)
      .eq("cafe_id", cafeId)
      .select("id, cafe_id, device_id, device_name, status, last_active, created_at")
      .maybeSingle();

    if (error) throw error;
    if (!updatedDevice) return { success: false, error: "Device status update affected no rows" };
    return { success: true, device: updatedDevice };
  } catch (error: unknown) {
    console.error("[updateDeviceStatus] POS device update failed", {
      cafeId,
      deviceId,
      error: getErrorMessage(error),
    });
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function deletePosDevice(cafeId: string, deviceId: string) {
  try {
    await assertAdminCafeAccess(cafeId);

    const { data: deletedDevice, error } = await supabaseAdmin
      .from("pos_devices")
      .delete()
      .eq("id", deviceId)
      .eq("cafe_id", cafeId)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!deletedDevice) return { success: false, error: "Device not found for this cafe" };
    return { success: true };
  } catch (error: unknown) {
    console.error("[deletePosDevice] POS device deletion failed", {
      cafeId,
      deviceId,
      error: getErrorMessage(error),
    });
    return { success: false, error: getErrorMessage(error) };
  }
}
