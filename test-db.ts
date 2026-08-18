import "dotenv/config";

import { randomUUID } from "node:crypto";
import { config as loadDotEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";

loadDotEnv({ path: ".env.local", override: false });
loadDotEnv({ path: ".env.supacloud", override: false });

type SupabaseErrorLike = {
  message: string;
  details?: string | null;
  hint?: string | null;
  code?: string | null;
  status?: number | string;
};

type QueryResponse<T> = {
  data: T | null;
  error: SupabaseErrorLike | null;
};

type CreatedIds = {
  authUserId?: string;
  cafeId?: string;
  categoryId?: string;
  modifierGroupId?: string;
  modifierOptionId?: string;
  productId?: string;
  tableId?: string;
  posDeviceId?: string;
  orderId?: string;
  paymentReceiptId?: string;
};

class DatabaseOperationError extends Error {
  readonly operation: string;
  readonly supabaseError: SupabaseErrorLike;

  constructor(operation: string, supabaseError: SupabaseErrorLike) {
    super(supabaseError.message);
    this.name = "DatabaseOperationError";
    this.operation = operation;
    this.supabaseError = supabaseError;
  }
}

const requiredEnvVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingEnvVars.length > 0) {
  throw new Error(
    `[INIT] Missing required environment variables: ${missingEnvVars.join(", ")}`
  );
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const created: CreatedIds = {};
const runId = `${Date.now()}-${randomUUID().slice(0, 8)}`;
const cafeSlug = `serveqr-test-${runId}`.toLowerCase();
const ownerEmail = `serveqr-test-${runId}@example.com`;
const ownerPassword = `ServeQR-Test-${randomUUID()}!A1`;
const tableNumber = `T-${runId.slice(-8)}`;
const deviceId = `serveqr-pos-${runId}`;
const sessionId = `serveqr-session-${runId}`;

let cleanupStarted = false;

function logSupabaseError(prefix: string, error: SupabaseErrorLike) {
  console.error(`${prefix} message: ${error.message}`);
  console.error(`${prefix} details: ${error.details ?? "(not provided)"}`);
  if (error.code) console.error(`${prefix} code: ${error.code}`);
  if (error.hint) console.error(`${prefix} hint: ${error.hint}`);
  if (error.status) console.error(`${prefix} status: ${error.status}`);
}

function assertSupabaseSuccess(operation: string, error: SupabaseErrorLike | null) {
  if (error) throw new DatabaseOperationError(operation, error);
}

async function expectSingle<T>(
  operation: string,
  query: PromiseLike<QueryResponse<T>>
): Promise<T> {
  const { data, error } = await query;
  assertSupabaseSuccess(operation, error);

  if (!data) {
    throw new Error(`[${operation}] Supabase returned no row and no error.`);
  }

  return data;
}

async function expectNoError<T>(
  operation: string,
  query: PromiseLike<QueryResponse<T>>
): Promise<T | null> {
  const { data, error } = await query;
  assertSupabaseSuccess(operation, error);
  return data;
}

async function step<T>(label: string, action: () => Promise<T>): Promise<T> {
  console.log(`[STEP] ${label}`);
  const result = await action();
  console.log(`[OK] ${label}`);
  return result;
}

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[ASSERT] ${message}`);
}

async function deleteWhere(
  table: string,
  column: string,
  value: string | undefined
): Promise<boolean> {
  if (!value) return true;

  const { error } = await supabaseAdmin.from(table).delete().eq(column, value);

  if (error) {
    logSupabaseError(`[CLEANUP] ${table}.${column}=${value}`, error);
    return false;
  }

  return true;
}

async function manualChildCleanup(): Promise<boolean> {
  console.log("[CLEANUP] Running manual child cleanup fallback.");

  const cleanupResults = [
    await deleteWhere("product_modifiers", "product_id", created.productId),
    await deleteWhere(
      "product_modifiers",
      "modifier_group_id",
      created.modifierGroupId
    ),
    await deleteWhere(
      "modifier_options",
      "modifier_group_id",
      created.modifierGroupId
    ),
    await deleteWhere("orders", "cafe_id", created.cafeId),
    await deleteWhere("pos_devices", "cafe_id", created.cafeId),
    await deleteWhere("payment_receipts", "cafe_id", created.cafeId),
    await deleteWhere("products", "cafe_id", created.cafeId),
    await deleteWhere("modifier_groups", "cafe_id", created.cafeId),
    await deleteWhere("menu_categories", "cafe_id", created.cafeId),
    await deleteWhere("tables", "cafe_id", created.cafeId),
    await deleteWhere("cafes", "id", created.cafeId),
  ];

  return cleanupResults.every(Boolean);
}

async function countRows(
  table: string,
  column: string,
  value: string | undefined
): Promise<number | null> {
  if (!value) return 0;

  const { count, error } = await supabaseAdmin
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq(column, value);

  if (error) {
    logSupabaseError(`[CLEANUP] Count ${table}.${column}=${value}`, error);
    return null;
  }

  return count ?? 0;
}

async function verifyCascadeCleanup(): Promise<boolean> {
  const checks = [
    ["cafes", "id", created.cafeId],
    ["tables", "cafe_id", created.cafeId],
    ["products", "cafe_id", created.cafeId],
    ["modifier_groups", "cafe_id", created.cafeId],
    ["orders", "cafe_id", created.cafeId],
    ["pos_devices", "cafe_id", created.cafeId],
    ["payment_receipts", "cafe_id", created.cafeId],
    ["product_modifiers", "product_id", created.productId],
    ["modifier_options", "modifier_group_id", created.modifierGroupId],
  ] as const;

  let allClear = true;

  for (const [table, column, value] of checks) {
    const count = await countRows(table, column, value);

    if (count === null) {
      allClear = false;
      continue;
    }

    if (count > 0) {
      console.error(
        `[CLEANUP] ${table} still has ${count} row(s) for ${column}=${value}.`
      );
      allClear = false;
    }
  }

  if (allClear) console.log("[CLEANUP] Cascade cleanup verification passed.");
  return allClear;
}

async function cleanup(): Promise<boolean> {
  if (cleanupStarted) return true;
  cleanupStarted = true;

  console.log("[CLEANUP] Starting cleanup.");
  let cleanupOk = true;

  if (created.cafeId) {
    const { error } = await supabaseAdmin
      .from("cafes")
      .delete()
      .eq("id", created.cafeId);

    if (error) {
      logSupabaseError("[CLEANUP] Delete test cafe", error);
      cleanupOk = (await manualChildCleanup()) && cleanupOk;
    } else {
      console.log("[CLEANUP] Deleted test cafe; dependent public rows should cascade.");
    }

    cleanupOk = (await verifyCascadeCleanup()) && cleanupOk;
  } else {
    console.log("[CLEANUP] No cafe was created.");
  }

  if (created.authUserId) {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(created.authUserId);

    if (error) {
      logSupabaseError("[CLEANUP] Delete test auth user", error);
      cleanupOk = false;
    } else {
      console.log("[CLEANUP] Deleted test auth user.");
    }
  } else {
    console.log("[CLEANUP] No auth user was created.");
  }

  return cleanupOk;
}

async function runJourney() {
  console.log(`[INIT] Starting ServeQR database integration test: ${runId}`);
  console.log("[INIT] Using Supabase service role client to bypass RLS.");

  const authUser = await step("Create test Admin auth user", async () => {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: ownerEmail,
      password: ownerPassword,
      email_confirm: true,
      user_metadata: {
        app: "ServeQR",
        test_run_id: runId,
      },
    });

    if (error) throw new DatabaseOperationError("Create auth user", error);
    assertCondition(data.user?.id, "Auth user was not returned.");
    created.authUserId = data.user.id;

    return data.user;
  });

  const cafe = await step("Create test Cafe record", async () => {
    const subscriptionEndsAt = new Date(
      Date.now() + 14 * 24 * 60 * 60 * 1000
    ).toISOString();

    const row = await expectSingle<any>(
      "Insert cafe",
      supabaseAdmin
        .from("cafes")
        .insert([
          {
            slug: cafeSlug,
            name: `ServeQR Test Cafe ${runId}`,
            admin_email: ownerEmail,
            owner_email: ownerEmail,
            owner_auth_id: authUser.id,
            admin_pin: "1357",
            cashier_pin: "2468",
            status: "active",
            is_active: true,
            allowed_radius: 250,
            subscription_status: "active",
            subscription_ends_at: subscriptionEndsAt,
            can_use_grace: true,
            plan_type: "silver",
            billing_cycle: "monthly",
            max_cashiers: 3,
            max_tables: 30,
            max_menu_items: 150,
            max_kitchens: 1,
            is_white_label: false,
            latitude: 33.5731,
            longitude: -7.5898,
          },
        ])
        .select(
          "id, slug, name, owner_email, owner_auth_id, subscription_status, plan_type, billing_cycle, max_cashiers, max_tables, max_menu_items"
        )
        .single()
    );

    created.cafeId = row.id;
    assertCondition(row.slug === cafeSlug, "Inserted cafe slug mismatch.");
    assertCondition(row.owner_auth_id === authUser.id, "Cafe owner_auth_id mismatch.");

    return row;
  });

  await step("Select Cafe by slug", async () => {
    const row = await expectSingle<any>(
      "Select cafe by slug",
      supabaseAdmin
        .from("cafes")
        .select(
          "id, slug, name, owner_email, subscription_status, subscription_ends_at, latitude, longitude"
        )
        .eq("slug", cafeSlug)
        .single()
    );

    assertCondition(row.id === cafe.id, "Selected cafe id mismatch.");
    assertCondition(row.subscription_status === "active", "Cafe should be active.");
  });

  await step("Update Cafe settings and subscription fields", async () => {
    const row = await expectSingle<any>(
      "Update cafe settings",
      supabaseAdmin
        .from("cafes")
        .update({
          name: `ServeQR Test Cafe Updated ${runId}`,
          admin_pin: "8642",
          cashier_pin: "9753",
          latitude: 34.0209,
          longitude: -6.8416,
          plan_type: "gold",
          billing_cycle: "monthly",
          max_cashiers: 3,
          max_tables: 100,
          max_menu_items: 9999,
          max_kitchens: 1,
          is_white_label: false,
        })
        .eq("id", cafe.id)
        .select(
          "id, name, admin_pin, cashier_pin, latitude, longitude, plan_type, billing_cycle, max_tables, max_menu_items"
        )
        .single()
    );

    assertCondition(row.plan_type === "gold", "Cafe plan update did not persist.");
    assertCondition(Number(row.max_tables) === 100, "Cafe max_tables update did not persist.");
  });

  const paymentReceipt = await step("Create and verify Payment Receipt", async () => {
    const row = await expectSingle<any>(
      "Insert payment receipt",
      supabaseAdmin
        .from("payment_receipts")
        .insert([
          {
            cafe_id: cafe.id,
            amount: 399,
            receipt_url: "https://example.com/serveqr-test-receipt.png",
            status: "pending",
            requested_plan: "gold",
            requested_cycle: "monthly",
          },
        ])
        .select("id, cafe_id, amount, status, requested_plan, requested_cycle")
        .single()
    );

    created.paymentReceiptId = row.id;
    assertCondition(row.cafe_id === cafe.id, "Payment receipt cafe_id mismatch.");
    assertCondition(row.status === "pending", "Payment receipt should start pending.");

    return row;
  });

  await step("Update Payment Receipt status", async () => {
    const row = await expectSingle<any>(
      "Update payment receipt status",
      supabaseAdmin
        .from("payment_receipts")
        .update({ status: "paid" })
        .eq("id", paymentReceipt.id)
        .eq("cafe_id", cafe.id)
        .select("id, status")
        .single()
    );

    assertCondition(row.status === "paid", "Payment receipt status update failed.");
  });

  const category = await step("Create Menu Category linked to Cafe", async () => {
    const row = await expectSingle<any>(
      "Insert menu category",
      supabaseAdmin
        .from("menu_categories")
        .insert([
          {
            cafe_id: cafe.id,
            name_ar: "Test Category AR",
            name_en: "Integration Test Category",
            name_fr: "Categorie Test Integration",
            icon: "Coffee",
            subcategories: ["Integration"],
          },
        ])
        .select("id, cafe_id, name_en, subcategories")
        .single()
    );

    created.categoryId = row.id;
    assertCondition(row.cafe_id === cafe.id, "Category cafe_id mismatch.");

    return row;
  });

  const table = await step("Create Table linked to Cafe", async () => {
    const row = await expectSingle<any>(
      "Insert table",
      supabaseAdmin
        .from("tables")
        .insert([
          {
            cafe_id: cafe.id,
            table_number: tableNumber,
          },
        ])
        .select("id, cafe_id, table_number, qr_token")
        .single()
    );

    created.tableId = row.id;
    assertCondition(row.cafe_id === cafe.id, "Table cafe_id mismatch.");
    assertCondition(row.table_number === tableNumber, "Table number mismatch.");
    assertCondition(row.qr_token, "Table qr_token should be generated.");

    return row;
  });

  const modifierGroup = await step("Create Modifier Group linked to Cafe", async () => {
    const row = await expectSingle<any>(
      "Insert modifier group",
      supabaseAdmin
        .from("modifier_groups")
        .insert([
          {
            cafe_id: cafe.id,
            name_ar: "Test Modifier AR",
            name_en: "Milk Choice",
            name_fr: "Choix de lait",
            type: "single_choice",
            min_selections: 0,
            max_selections: 1,
          },
        ])
        .select("id, cafe_id, name_en, type, min_selections, max_selections")
        .single()
    );

    created.modifierGroupId = row.id;
    assertCondition(row.type === "single_choice", "Modifier group type mismatch.");

    return row;
  });

  const modifierOption = await step("Create Modifier Option linked to Modifier Group", async () => {
    const row = await expectSingle<any>(
      "Insert modifier option",
      supabaseAdmin
        .from("modifier_options")
        .insert([
          {
            modifier_group_id: modifierGroup.id,
            name_ar: "Test Option AR",
            name_en: "Oat Milk",
            name_fr: "Lait d'avoine",
            price_adjustment: 2.5,
          },
        ])
        .select("id, modifier_group_id, name_en, price_adjustment")
        .single()
    );

    created.modifierOptionId = row.id;
    assertCondition(
      row.modifier_group_id === modifierGroup.id,
      "Modifier option group mismatch."
    );

    return row;
  });

  const product = await step("Create Product linked to Cafe and Category", async () => {
    const row = await expectSingle<any>(
      "Insert product",
      supabaseAdmin
        .from("products")
        .insert([
          {
            cafe_id: cafe.id,
            category_id: category.id,
            category: "Integration",
            sub_category: "Hot Drinks",
            name_ar: "Test Product AR",
            name_en: "Integration Test Latte",
            name_fr: "Latte Test Integration",
            description_ar: "Created by test-db.ts",
            price: 42.5,
            image_url: "https://example.com/serveqr-test-product.png",
            stock_status: "available",
            is_active: true,
          },
        ])
        .select(
          "id, cafe_id, category_id, name_ar, name_en, name_fr, price, is_active, stock_status"
        )
        .single()
    );

    created.productId = row.id;
    assertCondition(row.cafe_id === cafe.id, "Product cafe_id mismatch.");
    assertCondition(row.category_id === category.id, "Product category_id mismatch.");
    assertCondition(row.is_active === true, "Product should be active.");

    return row;
  });

  await step("Attach Modifier Group to Product", async () => {
    await expectNoError(
      "Insert product modifier link",
      supabaseAdmin.from("product_modifiers").insert([
        {
          product_id: product.id,
          modifier_group_id: modifierGroup.id,
          position_order: 0,
        },
      ])
    );
  });

  await step("Select Product with nested Modifier data", async () => {
    const row = await expectSingle<any>(
      "Select product with modifiers",
      supabaseAdmin
        .from("products")
        .select(
          `
          id,
          cafe_id,
          name_en,
          price,
          product_modifiers (
            modifier_group_id,
            position_order,
            modifier_groups (
              id,
              name_en,
              type,
              modifier_options (
                id,
                name_en,
                price_adjustment
              )
            )
          )
        `
        )
        .eq("id", product.id)
        .single()
    );

    const linkedModifier = row.product_modifiers?.[0];
    assertCondition(linkedModifier, "Product modifier link was not returned.");
    assertCondition(
      linkedModifier.modifier_group_id === modifierGroup.id,
      "Nested modifier group id mismatch."
    );
    assertCondition(
      linkedModifier.modifier_groups?.modifier_options?.[0]?.id === modifierOption.id,
      "Nested modifier option was not returned."
    );
  });

  const posDevice = await step("Register POS device with pending status", async () => {
    const row = await expectSingle<any>(
      "Insert POS device",
      supabaseAdmin
        .from("pos_devices")
        .insert([
          {
            cafe_id: cafe.id,
            device_id: deviceId,
            device_name: "ServeQR Integration POS",
            status: "pending",
          },
        ])
        .select("id, cafe_id, device_id, device_name, status, last_active")
        .single()
    );

    created.posDeviceId = row.id;
    assertCondition(row.status === "pending", "POS device should start pending.");

    return row;
  });

  await step("Approve POS device", async () => {
    const row = await expectSingle<any>(
      "Update POS device status",
      supabaseAdmin
        .from("pos_devices")
        .update({ status: "approved" })
        .eq("id", posDevice.id)
        .eq("cafe_id", cafe.id)
        .select("id, status")
        .single()
    );

    assertCondition(row.status === "approved", "POS device was not approved.");
  });

  const order = await step("Create Order linked to Cafe, Table, and Product", async () => {
    const basePrice = Number(product.price);
    const modifierPrice = Number(modifierOption.price_adjustment);
    const quantity = 2;
    const itemPrice = basePrice + modifierPrice;
    const totalAmount = itemPrice * quantity;

    const orderItems = [
      {
        id: `cart-${runId}-1`,
        product_id: product.id,
        name_ar: product.name_ar,
        name_en: product.name_en,
        name_fr: product.name_fr,
        price: itemPrice,
        quantity,
        modifiers: {
          [modifierGroup.id]: modifierOption.id,
        },
      },
    ];

    const row = await expectSingle<any>(
      "Insert order",
      supabaseAdmin
        .from("orders")
        .insert([
          {
            cafe_id: cafe.id,
            table_id: table.id,
            session_id: sessionId,
            items: orderItems,
            total_amount: totalAmount,
            status: "pending",
          },
        ])
        .select("id, cafe_id, table_id, session_id, items, total_amount, status")
        .single()
    );

    created.orderId = row.id;
    assertCondition(row.cafe_id === cafe.id, "Order cafe_id mismatch.");
    assertCondition(row.table_id === table.id, "Order table_id mismatch.");
    assertCondition(row.status === "pending", "Order should start pending.");
    assertCondition(Number(row.total_amount) === totalAmount, "Order total mismatch.");

    return row;
  });

  await step("Select active Orders with Table join", async () => {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*, tables(table_number)")
      .eq("cafe_id", cafe.id)
      .eq("session_id", sessionId)
      .neq("status", "completed")
      .neq("status", "rejected")
      .neq("status", "cancelled")
      .order("created_at", { ascending: false });

    assertSupabaseSuccess("Select active orders", error);
    assertCondition(Array.isArray(data), "Active orders result should be an array.");
    assertCondition(data.length === 1, "Expected exactly one active order.");
    assertCondition(data[0].tables?.table_number === tableNumber, "Order table join failed.");
  });

  await step("Update Order status from pending to accepted", async () => {
    const row = await expectSingle<any>(
      "Update order status to accepted",
      supabaseAdmin
        .from("orders")
        .update({ status: "accepted" })
        .eq("id", order.id)
        .eq("cafe_id", cafe.id)
        .select("id, status")
        .single()
    );

    assertCondition(row.status === "accepted", "Order was not accepted.");
  });

  await step("Update Order status from accepted to completed", async () => {
    const row = await expectSingle<any>(
      "Update order status to completed",
      supabaseAdmin
        .from("orders")
        .update({ status: "completed" })
        .eq("id", order.id)
        .eq("cafe_id", cafe.id)
        .select("id, status")
        .single()
    );

    assertCondition(row.status === "completed", "Order was not completed.");
  });

  await step("Verify completed Order appears in sales query", async () => {
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    ).toISOString();

    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*, tables(table_number)")
      .eq("cafe_id", cafe.id)
      .eq("status", "completed")
      .gte("created_at", startOfMonth)
      .order("created_at", { ascending: false });

    assertSupabaseSuccess("Select completed monthly orders", error);
    assertCondition(
      Array.isArray(data) && data.some((row) => row.id === order.id),
      "Completed order was not returned by monthly sales query."
    );
  });
}

async function main() {
  try {
    await runJourney();
  } catch (error) {
    console.error("[ERROR] ServeQR database integration test failed.");

    if (error instanceof DatabaseOperationError) {
      console.error(`[ERROR] Operation: ${error.operation}`);
      logSupabaseError("[ERROR] Supabase", error.supabaseError);
    } else if (error instanceof Error) {
      console.error(`[ERROR] message: ${error.message}`);
      console.error("[ERROR] details: (not provided)");
    } else {
      console.error("[ERROR] message: Unknown error");
      console.error("[ERROR] details: (not provided)");
    }

    const cleanupOk = await cleanup();
    if (!cleanupOk) {
      console.error("[ERROR] Cleanup did not fully complete. Inspect the test ids above.");
    }
    process.exit(1);
  }

  const cleanupOk = await cleanup();
  if (!cleanupOk) {
    console.error("[ERROR] ServeQR database integration test passed, but cleanup failed.");
    process.exit(1);
  }

  console.log("[DONE] ServeQR database integration test passed and cleaned up.");
}

main().catch(async (error) => {
  console.error("[ERROR] Unhandled failure in test runner.");

  if (error instanceof DatabaseOperationError) {
    console.error(`[ERROR] Operation: ${error.operation}`);
    logSupabaseError("[ERROR] Supabase", error.supabaseError);
  } else if (error instanceof Error) {
    console.error(`[ERROR] message: ${error.message}`);
    console.error("[ERROR] details: (not provided)");
  } else {
    console.error("[ERROR] message: Unknown error");
    console.error("[ERROR] details: (not provided)");
  }

  const cleanupOk = await cleanup();
  if (!cleanupOk) {
    console.error("[ERROR] Cleanup did not fully complete. Inspect the test ids above.");
  }

  process.exit(1);
});
