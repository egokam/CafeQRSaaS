"use client";

import { useState, useEffect } from "react";

// بيانات البداية (Seed Data)
const INITIAL_PRODUCTS = [
  { id: "1", name_ar: "فلات وايت", name_en: "Flat White", name_fr: "Flat White", description_ar: "قهوة غنية بالحليب", price: 32, category: "القهوة", image_url: "https://images.unsplash.com/photo-1578314675249-a694eb286151?w=400&q=80" },
  { id: "2", name_ar: "كرواسون باللوز", name_en: "Almond Croissant", name_fr: "Croissant aux amandes", description_ar: "مخبوزات طازجة", price: 26, category: "مخبوزات", image_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80" },
  { id: "3", name_ar: "ماتشا كلاود", name_en: "Matcha Cloud", name_fr: "Matcha", description_ar: "ماتشا يابانية", price: 42, category: "القهوة", image_url: "https://images.unsplash.com/photo-1515823662972-da6a2b4d3002?w=400&q=80" }
];

const INITIAL_ORDERS = [
  { id: "ORD-9381", tables: { table_number: "table_4" }, items: [{quantity: 2, name_ar: "فلات وايت"}], total_amount: 64, status: "pending", created_at: new Date().toISOString() }
];

// دوال التحكم في LocalStorage
const getDemoData = (key: string, initial: any) => {
  if (typeof window === 'undefined') return initial;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : initial;
};

const setDemoData = (key: string, data: any) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
  window.dispatchEvent(new Event('demo-storage-update')); // تحديث فوري في نفس الصفحة
};

// 🌟 هوك المنتجات (Shared Products Hook)
export function useDemoProducts() {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    setProducts(getDemoData('demo_products', INITIAL_PRODUCTS));
    const sync = () => setProducts(getDemoData('demo_products', INITIAL_PRODUCTS));
    
    window.addEventListener('storage', sync); // كيسمع للتغييرات بين الـ Tabs
    window.addEventListener('demo-storage-update', sync); // كيسمع في نفس الـ Window
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('demo-storage-update', sync);
    };
  }, []);

  const updateProducts = (newProducts: any[]) => {
    setProducts(newProducts);
    setDemoData('demo_products', newProducts);
  };

  return { products, updateProducts };
}

// 🌟 هوك الطلبات (Shared Orders Hook)
export function useDemoOrders() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    setOrders(getDemoData('demo_orders', INITIAL_ORDERS));
    const sync = () => setOrders(getDemoData('demo_orders', INITIAL_ORDERS));
    
    window.addEventListener('storage', sync);
    window.addEventListener('demo-storage-update', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('demo-storage-update', sync);
    };
  }, []);

  const updateOrders = (newOrders: any[]) => {
    setOrders(newOrders);
    setDemoData('demo_orders', newOrders);
  };

  return { orders, updateOrders };
}