"use client";

import { useEffect, useState } from "react";

export const DEMO_CAFE_ID = "00000000-0000-4000-8000-000000000001";
export const DEMO_STORAGE_EVENT = "demo-storage-update";

const DEMO_STORE_VERSION = "2026-08-17-production-shape-v1";
const VERSION_KEY = "demo_store_version";
const PRODUCTS_KEY = "demo_products";
const ORDERS_KEY = "demo_orders";
const DEMO_CREATED_AT = "2026-08-17T08:00:00.000Z";

const DEMO_CATEGORY_IDS = {
  hotCoffee: "11111111-1111-4111-8111-000000000001",
  coldCoffee: "11111111-1111-4111-8111-000000000002",
  patisserie: "11111111-1111-4111-8111-000000000003",
  desserts: "11111111-1111-4111-8111-000000000004",
  juices: "11111111-1111-4111-8111-000000000005",
  breakfasts: "11111111-1111-4111-8111-000000000006",
} as const;

const DEMO_PRODUCT_IDS = {
  flatWhite: "22222222-2222-4222-8222-000000000001",
  espresso: "22222222-2222-4222-8222-000000000002",
  icedLatte: "22222222-2222-4222-8222-000000000003",
  matcha: "22222222-2222-4222-8222-000000000004",
  croissant: "22222222-2222-4222-8222-000000000005",
  painAuChocolat: "22222222-2222-4222-8222-000000000006",
  cheesecake: "22222222-2222-4222-8222-000000000007",
  tiramisu: "22222222-2222-4222-8222-000000000008",
  orangeJuice: "22222222-2222-4222-8222-000000000009",
  berrySmoothie: "22222222-2222-4222-8222-000000000010",
  avocadoToast: "22222222-2222-4222-8222-000000000011",
  shakshuka: "22222222-2222-4222-8222-000000000012",
} as const;

export type DemoOrderStatus = "pending" | "accepted" | "ready" | "completed" | "rejected" | "cancelled";
export type DemoModifierType = "single_choice" | "multiple_choice" | "incremental" | "slider";

export type DemoCafe = {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  is_white_label: boolean;
  max_cashiers: number;
  max_tables: number;
  max_menu_items: number;
};

export type DemoCategory = {
  id: string;
  cafe_id: string;
  name_ar: string;
  name_en: string;
  name_fr: string;
  icon: string;
  created_at: string;
};

export type DemoTable = {
  id: string;
  cafe_id: string;
  table_number: string;
  qr_token: string;
  created_at: string;
};

export type DemoModifierOption = {
  id: string;
  modifier_group_id: string;
  name_ar?: string | null;
  name_en?: string | null;
  name_fr?: string | null;
  price_adjustment: number;
};

export type DemoModifierGroup = {
  id: string;
  name_ar?: string | null;
  name_en?: string | null;
  name_fr?: string | null;
  type: DemoModifierType;
  min_selections: number;
  max_selections: number;
  options: DemoModifierOption[];
  modifier_options?: DemoModifierOption[];
};

export type DemoProduct = {
  id: string;
  cafe_id: string;
  category_id: string;
  sub_category: string | null;
  name_ar: string;
  name_en: string;
  name_fr: string;
  description_ar: string | null;
  description_en: string | null;
  description_fr: string | null;
  image_url: string | null;
  price: number;
  category: string;
  stock_status: "available" | "out_of_stock";
  is_active: boolean;
  created_at: string;
  modifier_groups: DemoModifierGroup[];
  [key: string]: unknown;
};

export type DemoOrderItem = {
  id: string;
  product_id: string;
  name_ar: string;
  name_en?: string;
  name_fr?: string;
  price: number;
  quantity: number;
  image_url: string;
  modifiers: Record<string, number>;
};

export type DemoOrder = {
  id: string;
  cafe_id: string;
  table_id: string | null;
  session_id: string | null;
  items: DemoOrderItem[];
  total_amount: number;
  status: DemoOrderStatus;
  created_at: string;
  updated_at: string;
  client_auth_id?: string | null;
  tables?: { table_number: string } | null;
};

export const DEMO_CAFE: DemoCafe = {
  id: DEMO_CAFE_ID,
  slug: "demo-cafe",
  name: "ServeQR Demo",
  logo_url: null,
  is_white_label: false,
  max_cashiers: 3,
  max_tables: 30,
  max_menu_items: 150,
};

export const DEMO_CATEGORIES: DemoCategory[] = [
  {
    id: DEMO_CATEGORY_IDS.hotCoffee,
    cafe_id: DEMO_CAFE_ID,
    name_ar: "القهوة",
    name_en: "Hot Coffee",
    name_fr: "Café chaud",
    icon: "Coffee",
    created_at: DEMO_CREATED_AT,
  },
  {
    id: DEMO_CATEGORY_IDS.coldCoffee,
    cafe_id: DEMO_CAFE_ID,
    name_ar: "قهوة باردة",
    name_en: "Cold Coffee",
    name_fr: "Café froid",
    icon: "Snowflake",
    created_at: DEMO_CREATED_AT,
  },
  {
    id: DEMO_CATEGORY_IDS.patisserie,
    cafe_id: DEMO_CAFE_ID,
    name_ar: "مخبوزات",
    name_en: "Patisserie",
    name_fr: "Patisserie",
    icon: "Croissant",
    created_at: DEMO_CREATED_AT,
  },
  {
    id: DEMO_CATEGORY_IDS.desserts,
    cafe_id: DEMO_CAFE_ID,
    name_ar: "الحلوى",
    name_en: "Desserts",
    name_fr: "Desserts",
    icon: "CakeSlice",
    created_at: DEMO_CREATED_AT,
  },
  {
    id: DEMO_CATEGORY_IDS.juices,
    cafe_id: DEMO_CAFE_ID,
    name_ar: "عصائر",
    name_en: "Juices",
    name_fr: "Jus",
    icon: "CupSoda",
    created_at: DEMO_CREATED_AT,
  },
  {
    id: DEMO_CATEGORY_IDS.breakfasts,
    cafe_id: DEMO_CAFE_ID,
    name_ar: "فطور",
    name_en: "Breakfasts",
    name_fr: "Petits déjeuners",
    icon: "Utensils",
    created_at: DEMO_CREATED_AT,
  },
];

export const DEMO_TABLES: DemoTable[] = [
  { id: "33333333-3333-4333-8333-000000000001", cafe_id: DEMO_CAFE_ID, table_number: "table_1", qr_token: "demo-table-1", created_at: DEMO_CREATED_AT },
  { id: "33333333-3333-4333-8333-000000000002", cafe_id: DEMO_CAFE_ID, table_number: "table_2", qr_token: "demo-table-2", created_at: DEMO_CREATED_AT },
  { id: "33333333-3333-4333-8333-000000000004", cafe_id: DEMO_CAFE_ID, table_number: "table_4", qr_token: "demo-table-4", created_at: DEMO_CREATED_AT },
  { id: "33333333-3333-4333-8333-000000000007", cafe_id: DEMO_CAFE_ID, table_number: "table_7", qr_token: "demo-table-7", created_at: DEMO_CREATED_AT },
  { id: "33333333-3333-4333-8333-000000000012", cafe_id: DEMO_CAFE_ID, table_number: "table_12", qr_token: "demo-table-12", created_at: DEMO_CREATED_AT },
];

const legacyCategoryById: Record<string, string> = {
  [DEMO_CATEGORY_IDS.hotCoffee]: "القهوة",
  [DEMO_CATEGORY_IDS.coldCoffee]: "القهوة",
  [DEMO_CATEGORY_IDS.patisserie]: "مخبوزات",
  [DEMO_CATEGORY_IDS.desserts]: "الحلوى",
  [DEMO_CATEGORY_IDS.juices]: "عصائر",
  [DEMO_CATEGORY_IDS.breakfasts]: "مخبوزات",
};

const legacyCategoryToId: Record<string, string> = {
  "القهوة": DEMO_CATEGORY_IDS.hotCoffee,
  "قهوة": DEMO_CATEGORY_IDS.hotCoffee,
  coffee: DEMO_CATEGORY_IDS.hotCoffee,
  "hot coffee": DEMO_CATEGORY_IDS.hotCoffee,
  "cold coffee": DEMO_CATEGORY_IDS.coldCoffee,
  "café": DEMO_CATEGORY_IDS.hotCoffee,
  cafe: DEMO_CATEGORY_IDS.hotCoffee,
  "café chaud": DEMO_CATEGORY_IDS.hotCoffee,
  "café froid": DEMO_CATEGORY_IDS.coldCoffee,
  "مخبوزات": DEMO_CATEGORY_IDS.patisserie,
  bakery: DEMO_CATEGORY_IDS.patisserie,
  patisserie: DEMO_CATEGORY_IDS.patisserie,
  "الحلوى": DEMO_CATEGORY_IDS.desserts,
  sweets: DEMO_CATEGORY_IDS.desserts,
  desserts: DEMO_CATEGORY_IDS.desserts,
  "عصائر": DEMO_CATEGORY_IDS.juices,
  juices: DEMO_CATEGORY_IDS.juices,
  jus: DEMO_CATEGORY_IDS.juices,
  "فطور": DEMO_CATEGORY_IDS.breakfasts,
  breakfast: DEMO_CATEGORY_IDS.breakfasts,
  breakfasts: DEMO_CATEGORY_IDS.breakfasts,
};

const categoryIds = new Set(DEMO_CATEGORIES.map((category) => category.id));

const makeProduct = ({
  id,
  category_id,
  sub_category,
  name_ar,
  name_en,
  name_fr,
  description_ar,
  description_en,
  description_fr,
  image_url,
  price,
}: {
  id: string;
  category_id: string;
  sub_category: string | null;
  name_ar: string;
  name_en: string;
  name_fr: string;
  description_ar: string;
  description_en: string;
  description_fr: string;
  image_url: string;
  price: number;
}): DemoProduct => ({
  id,
  cafe_id: DEMO_CAFE_ID,
  category_id,
  sub_category,
  name_ar,
  name_en,
  name_fr,
  description_ar,
  description_en,
  description_fr,
  image_url,
  price,
  category: legacyCategoryById[category_id] || "القهوة",
  stock_status: "available",
  is_active: true,
  created_at: DEMO_CREATED_AT,
  modifier_groups: [],
});

export const INITIAL_PRODUCTS: DemoProduct[] = [
  makeProduct({
    id: DEMO_PRODUCT_IDS.flatWhite,
    category_id: DEMO_CATEGORY_IDS.hotCoffee,
    sub_category: "Espresso Bar",
    name_ar: "فلات وايت",
    name_en: "Flat White",
    name_fr: "Flat White",
    description_ar: "إسبريسو ناعم مع حليب مبخر",
    description_en: "Silky espresso with steamed milk",
    description_fr: "Espresso soyeux au lait vapeur",
    image_url: "/demo/flatwhite.jpg",
    price: 32,
  }),
  makeProduct({
    id: DEMO_PRODUCT_IDS.espresso,
    category_id: DEMO_CATEGORY_IDS.hotCoffee,
    sub_category: "Espresso Bar",
    name_ar: "إسبريسو مزدوج",
    name_en: "Double Espresso",
    name_fr: "Double espresso",
    description_ar: "جرعة مركزة بطابع قوي",
    description_en: "A short, bold double shot",
    description_fr: "Double dose courte et intense",
    image_url: "/demo/espresso.jpg",
    price: 22,
  }),
  makeProduct({
    id: DEMO_PRODUCT_IDS.icedLatte,
    category_id: DEMO_CATEGORY_IDS.coldCoffee,
    sub_category: "Iced Classics",
    name_ar: "آيس لاتيه",
    name_en: "Iced Latte",
    name_fr: "Latte glacé",
    description_ar: "إسبريسو بارد مع حليب طازج",
    description_en: "Chilled espresso with fresh milk",
    description_fr: "Espresso froid au lait frais",
    image_url: "/demo/icedlatte.jpg",
    price: 36,
  }),
  makeProduct({
    id: DEMO_PRODUCT_IDS.matcha,
    category_id: DEMO_CATEGORY_IDS.coldCoffee,
    sub_category: "Iced Classics",
    name_ar: "ماتشا كلاود",
    name_en: "Matcha Cloud",
    name_fr: "Matcha Cloud",
    description_ar: "ماتشا يابانية مع رغوة كريمية",
    description_en: "Japanese matcha with creamy foam",
    description_fr: "Matcha japonais et mousse crémeuse",
    image_url: "/demo/matcha.jpg",
    price: 42,
  }),
  makeProduct({
    id: DEMO_PRODUCT_IDS.croissant,
    category_id: DEMO_CATEGORY_IDS.patisserie,
    sub_category: "Viennoiserie",
    name_ar: "كرواسون باللوز",
    name_en: "Almond Croissant",
    name_fr: "Croissant aux amandes",
    description_ar: "كرواسون مورق بحشوة اللوز",
    description_en: "Flaky croissant with almond cream",
    description_fr: "Croissant feuilleté à la crème d'amande",
    image_url: "/demo/croissant.jpg",
    price: 26,
  }),
  makeProduct({
    id: DEMO_PRODUCT_IDS.painAuChocolat,
    category_id: DEMO_CATEGORY_IDS.patisserie,
    sub_category: "Viennoiserie",
    name_ar: "بان أو شوكولا",
    name_en: "Pain au Chocolat",
    name_fr: "Pain au chocolat",
    description_ar: "عجينة فرنسية بزبدة وشوكولا",
    description_en: "Buttery pastry with dark chocolate",
    description_fr: "Viennoiserie au beurre et chocolat noir",
    image_url: "/demo/painauchocolat.jpg",
    price: 24,
  }),
  makeProduct({
    id: DEMO_PRODUCT_IDS.cheesecake,
    category_id: DEMO_CATEGORY_IDS.desserts,
    sub_category: "Signature Cakes",
    name_ar: "تشيزكيك بالفستق",
    name_en: "Pistachio Cheesecake",
    name_fr: "Cheesecake pistache",
    description_ar: "تشيزكيك كريمي بطبقة فستق",
    description_en: "Creamy cheesecake with pistachio glaze",
    description_fr: "Cheesecake crémeux au glaçage pistache",
    image_url: "/demo/cheesecake.jpg",
    price: 38,
  }),
  makeProduct({
    id: DEMO_PRODUCT_IDS.tiramisu,
    category_id: DEMO_CATEGORY_IDS.desserts,
    sub_category: "Signature Cakes",
    name_ar: "تيراميسو",
    name_en: "Tiramisu Cup",
    name_fr: "Tiramisu",
    description_ar: "ماسكاربوني وقهوة في كوب",
    description_en: "Mascarpone, espresso, and cocoa",
    description_fr: "Mascarpone, espresso et cacao",
    image_url: "/demo/tiramisu.jpg",
    price: 34,
  }),
  makeProduct({
    id: DEMO_PRODUCT_IDS.orangeJuice,
    category_id: DEMO_CATEGORY_IDS.juices,
    sub_category: "Fresh Pressed",
    name_ar: "عصير برتقال",
    name_en: "Orange Juice",
    name_fr: "Jus d'orange",
    description_ar: "برتقال طازج معصور عند الطلب",
    description_en: "Fresh oranges pressed to order",
    description_fr: "Oranges fraîches pressées à la demande",
    image_url: "/demo/orangejuice.jpg",
    price: 25,
  }),
  makeProduct({
    id: DEMO_PRODUCT_IDS.berrySmoothie,
    category_id: DEMO_CATEGORY_IDS.juices,
    sub_category: "Smoothies",
    name_ar: "سموثي التوت",
    name_en: "Berry Smoothie",
    name_fr: "Smoothie fruits rouges",
    description_ar: "توت وموز ولبن منعش",
    description_en: "Berries, banana, and yogurt",
    description_fr: "Fruits rouges, banane et yaourt",
    image_url: "/demo/berrysmoothie.jpg",
    price: 39,
  }),
  makeProduct({
    id: DEMO_PRODUCT_IDS.avocadoToast,
    category_id: DEMO_CATEGORY_IDS.breakfasts,
    sub_category: "All Day",
    name_ar: "توست أفوكادو",
    name_en: "Avocado Toast",
    name_fr: "Toast avocat",
    description_ar: "خبز محمص وأفوكادو وبيض",
    description_en: "Sourdough, avocado, and egg",
    description_fr: "Pain au levain, avocat et oeuf",
    image_url: "/demo/avocadotoast.jpg",
    price: 44,
  }),
  makeProduct({
    id: DEMO_PRODUCT_IDS.shakshuka,
    category_id: DEMO_CATEGORY_IDS.breakfasts,
    sub_category: "All Day",
    name_ar: "شكشوكة",
    name_en: "Shakshuka Skillet",
    name_fr: "Shakshuka",
    description_ar: "بيض بصلصة الطماطم والتوابل",
    description_en: "Eggs in spiced tomato sauce",
    description_fr: "Oeufs à la sauce tomate épicée",
    image_url: "/demo/shakshuka.jpg",
    price: 48,
  }),
];

export const DEMO_PRODUCT_IMAGE_ASSETS = INITIAL_PRODUCTS.map((product) =>
  `public${product.image_url}`
);

export const DEMO_CATEGORY_IMAGE_ASSETS = [
  "public/icons/cat_hot_coffee.png",
  "public/icons/cat_cold_coffee.png",
  "public/icons/cat_patisserie.png",
  "public/icons/cat_desserts.png",
  "public/icons/cat_juices.png",
  "public/icons/cat_breakfasts.png",
  "public/banners/hot_coffee.png",
  "public/banners/cold_coffee.png",
  "public/banners/patisserie.png",
  "public/banners/desserts.png",
  "public/banners/juices.png",
  "public/banners/breakfasts.png",
];

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const asString = (value: unknown, fallback = "") => {
  if (typeof value === "string" && value.trim() !== "") return value;
  if (typeof value === "number") return String(value);
  return fallback;
};

const asNullableString = (value: unknown, fallback: string | null = null) => {
  if (typeof value === "string") return value;
  return fallback;
};

const asNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getDemoUUID = () => {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
};

const findCategoryId = (rawCategoryId: unknown, rawCategory: unknown) => {
  const categoryId = asString(rawCategoryId);
  if (categoryIds.has(categoryId)) return categoryId;

  const category = asString(rawCategory).trim();
  return legacyCategoryToId[category] || legacyCategoryToId[category.toLowerCase()] || DEMO_CATEGORY_IDS.hotCoffee;
};

const findTable = (tableId?: string | null, tableNumber?: string | null) =>
  DEMO_TABLES.find((table) => table.id === tableId) ||
  DEMO_TABLES.find((table) => table.table_number === tableNumber) ||
  null;

const findProduct = (productId?: string | null) =>
  INITIAL_PRODUCTS.find((product) => product.id === productId) || null;

const normalizeProduct = (rawProduct: unknown): DemoProduct => {
  const raw = asRecord(rawProduct);
  const categoryId = findCategoryId(raw.category_id, raw.category);
  const nameEn = asString(raw.name_en, asString(raw.name_ar, "Demo Product"));
  const nameAr = asString(raw.name_ar, nameEn);
  const nameFr = asString(raw.name_fr, nameEn);
  const descriptionEn = asNullableString(raw.description_en, asNullableString(raw.description_ar));
  const descriptionAr = asNullableString(raw.description_ar, descriptionEn);
  const descriptionFr = asNullableString(raw.description_fr, descriptionEn);
  const isActive = raw.is_active !== false;

  return {
    ...raw,
    id: asString(raw.id, getDemoUUID()),
    cafe_id: DEMO_CAFE_ID,
    category_id: categoryId,
    sub_category: asNullableString(raw.sub_category),
    name_ar: nameAr,
    name_en: nameEn,
    name_fr: nameFr,
    description_ar: descriptionAr,
    description_en: descriptionEn,
    description_fr: descriptionFr,
    image_url: asNullableString(raw.image_url, "/demo/flatwhite.jpg"),
    price: asNumber(raw.price),
    category: legacyCategoryById[categoryId] || "القهوة",
    stock_status: raw.stock_status === "out_of_stock" || !isActive ? "out_of_stock" : "available",
    is_active: isActive,
    created_at: asString(raw.created_at, DEMO_CREATED_AT),
    modifier_groups: Array.isArray(raw.modifier_groups) ? (raw.modifier_groups as DemoModifierGroup[]) : [],
  };
};

const normalizeProducts = (rawProducts: unknown): DemoProduct[] => {
  if (!Array.isArray(rawProducts)) return clone(INITIAL_PRODUCTS);
  return rawProducts.map(normalizeProduct);
};

const normalizeOrderItem = (rawItem: unknown): DemoOrderItem => {
  const raw = asRecord(rawItem);
  const productId = asString(raw.product_id, asString(raw.id));
  const product = findProduct(productId);
  const itemId = asString(raw.id, product?.id || productId || getDemoUUID());
  const nameEn = asString(raw.name_en, product?.name_en || asString(raw.name_ar, "Demo Item"));
  const nameAr = asString(raw.name_ar, product?.name_ar || nameEn);
  const nameFr = asString(raw.name_fr, product?.name_fr || nameEn);
  const modifiers = raw.modifiers && typeof raw.modifiers === "object"
    ? (raw.modifiers as Record<string, number>)
    : {};

  return {
    id: itemId,
    product_id: product?.id || productId || itemId,
    name_ar: nameAr,
    name_en: nameEn,
    name_fr: nameFr,
    price: asNumber(raw.price, product?.price || 0),
    quantity: Math.max(1, Math.min(99, Math.round(asNumber(raw.quantity, 1)))),
    image_url: asString(raw.image_url, product?.image_url || ""),
    modifiers,
  };
};

const normalizeOrderItems = (rawItems: unknown): DemoOrderItem[] => {
  if (!Array.isArray(rawItems)) return [];
  return rawItems.map(normalizeOrderItem);
};

const normalizeOrder = (rawOrder: unknown): DemoOrder => {
  const raw = asRecord(rawOrder);
  const items = normalizeOrderItems(raw.items);
  const rawTable = asRecord(raw.tables);
  const tableId = typeof raw.table_id === "string" ? raw.table_id : null;
  const rawTableNumber = typeof rawTable.table_number === "string" ? rawTable.table_number : null;
  const table = findTable(tableId, rawTableNumber);
  const rawStatus = asString(raw.status, "pending");
  const status = ["pending", "accepted", "ready", "completed", "rejected", "cancelled"].includes(rawStatus)
    ? (rawStatus as DemoOrderStatus)
    : "pending";
  const totalAmount = raw.total_amount === undefined
    ? items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    : asNumber(raw.total_amount);

  return {
    ...raw,
    id: asString(raw.id, getDemoUUID()),
    cafe_id: DEMO_CAFE_ID,
    table_id: table?.id || tableId,
    session_id: typeof raw.session_id === "string" ? raw.session_id : null,
    items,
    total_amount: totalAmount,
    status,
    created_at: asString(raw.created_at, new Date().toISOString()),
    updated_at: asString(raw.updated_at, new Date().toISOString()),
    client_auth_id: typeof raw.client_auth_id === "string" ? raw.client_auth_id : null,
    tables: table ? { table_number: table.table_number } : rawTableNumber ? { table_number: rawTableNumber } : null,
  };
};

const normalizeOrders = (rawOrders: unknown): DemoOrder[] => {
  if (!Array.isArray(rawOrders)) return buildInitialOrders();
  return rawOrders.map(normalizeOrder);
};

const makeOrderItem = (productId: string, quantity: number): DemoOrderItem => {
  const product = findProduct(productId) || INITIAL_PRODUCTS[0];
  return {
    id: product.id,
    product_id: product.id,
    name_ar: product.name_ar,
    name_en: product.name_en,
    name_fr: product.name_fr,
    price: product.price,
    quantity,
    image_url: product.image_url || "",
    modifiers: {},
  };
};

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

export function buildInitialOrders(): DemoOrder[] {
  const orderSeeds: Array<{
    id: string;
    table_id: string;
    session_id: string;
    status: DemoOrderStatus;
    created_at: string;
    items: DemoOrderItem[];
  }> = [
    {
      id: "44444444-4444-4444-8444-000000000001",
      table_id: DEMO_TABLES[1].id,
      session_id: "demo-seed-client-1",
      status: "pending",
      created_at: minutesAgo(4),
      items: [
        makeOrderItem(DEMO_PRODUCT_IDS.flatWhite, 2),
        makeOrderItem(DEMO_PRODUCT_IDS.croissant, 1),
      ],
    },
    {
      id: "44444444-4444-4444-8444-000000000002",
      table_id: DEMO_TABLES[2].id,
      session_id: "demo-seed-client-2",
      status: "accepted",
      created_at: minutesAgo(12),
      items: [
        makeOrderItem(DEMO_PRODUCT_IDS.icedLatte, 1),
        makeOrderItem(DEMO_PRODUCT_IDS.avocadoToast, 1),
      ],
    },
    {
      id: "44444444-4444-4444-8444-000000000003",
      table_id: DEMO_TABLES[3].id,
      session_id: "demo-seed-client-3",
      status: "ready",
      created_at: minutesAgo(18),
      items: [
        makeOrderItem(DEMO_PRODUCT_IDS.orangeJuice, 2),
        makeOrderItem(DEMO_PRODUCT_IDS.cheesecake, 1),
      ],
    },
  ];

  return orderSeeds.map((seed) => {
    const table = findTable(seed.table_id);
    const total = seed.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return {
      id: seed.id,
      cafe_id: DEMO_CAFE_ID,
      table_id: seed.table_id,
      session_id: seed.session_id,
      items: seed.items,
      total_amount: total,
      status: seed.status,
      created_at: seed.created_at,
      updated_at: seed.created_at,
      client_auth_id: null,
      tables: table ? { table_number: table.table_number } : null,
    };
  });
}

export function createDemoOrder({
  tableId,
  sessionId,
  items,
  status = "pending",
}: {
  tableId: string | null;
  sessionId: string | null;
  items: unknown[];
  status?: DemoOrderStatus;
}): DemoOrder {
  const normalizedItems = normalizeOrderItems(items);
  const table = findTable(tableId);
  const now = new Date().toISOString();

  return {
    id: getDemoUUID(),
    cafe_id: DEMO_CAFE_ID,
    table_id: table?.id || tableId,
    session_id: sessionId,
    items: normalizedItems,
    total_amount: normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    status,
    created_at: now,
    updated_at: now,
    client_auth_id: null,
    tables: table ? { table_number: table.table_number } : null,
  };
}

const readStoredValue = (key: string, initialValue: unknown) => {
  if (typeof window === "undefined") return clone(initialValue);

  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : clone(initialValue);
  } catch {
    return clone(initialValue);
  }
};

const writeStoredValue = (key: string, value: unknown) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(DEMO_STORAGE_EVENT, { detail: { key } }));
};

const ensureDemoDefaults = () => {
  if (typeof window === "undefined") return;

  const currentVersion = localStorage.getItem(VERSION_KEY);
  if (currentVersion !== DEMO_STORE_VERSION) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem(ORDERS_KEY, JSON.stringify(buildInitialOrders()));
    localStorage.setItem(VERSION_KEY, DEMO_STORE_VERSION);
    window.dispatchEvent(new CustomEvent(DEMO_STORAGE_EVENT, { detail: { key: VERSION_KEY } }));
    return;
  }

  if (!localStorage.getItem(PRODUCTS_KEY)) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
  }
  if (!localStorage.getItem(ORDERS_KEY)) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(buildInitialOrders()));
  }
};

const readDemoProducts = () => normalizeProducts(readStoredValue(PRODUCTS_KEY, INITIAL_PRODUCTS));
const readDemoOrders = () => normalizeOrders(readStoredValue(ORDERS_KEY, buildInitialOrders()));

export function useDemoProducts() {
  const [products, setProducts] = useState<DemoProduct[]>(() => clone(INITIAL_PRODUCTS));

  useEffect(() => {
    const sync = () => setProducts(readDemoProducts());

    ensureDemoDefaults();
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(DEMO_STORAGE_EVENT, sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(DEMO_STORAGE_EVENT, sync);
    };
  }, []);

  const updateProducts = (newProducts: unknown[]) => {
    const normalizedProducts = normalizeProducts(newProducts);
    setProducts(normalizedProducts);
    writeStoredValue(PRODUCTS_KEY, normalizedProducts);
  };

  return { products, updateProducts };
}

export function useDemoOrders() {
  const [orders, setOrders] = useState<DemoOrder[]>(() => buildInitialOrders());

  useEffect(() => {
    const sync = () => setOrders(readDemoOrders());

    ensureDemoDefaults();
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(DEMO_STORAGE_EVENT, sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(DEMO_STORAGE_EVENT, sync);
    };
  }, []);

  const updateOrders = (newOrders: unknown[]) => {
    const normalizedOrders = normalizeOrders(newOrders);
    setOrders(normalizedOrders);
    writeStoredValue(ORDERS_KEY, normalizedOrders);
  };

  return { orders, updateOrders };
}

export function useDemoCategories() {
  const [categories] = useState<DemoCategory[]>(() => clone(DEMO_CATEGORIES));
  return { categories };
}

export function useDemoTables() {
  const [tables] = useState<DemoTable[]>(() => clone(DEMO_TABLES));
  return { tables };
}
