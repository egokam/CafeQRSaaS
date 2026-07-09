"use client";

import { useState, useEffect } from "react";

// بيانات البداية (Seed Data)
const INITIAL_PRODUCTS = [
  { id: "1", name_ar: "فلات وايت", name_en: "Flat White", name_fr: "Flat White", description_ar: "قهوة غنية بالحليب", price: 32, category: "القهوة", image_url: "/demo/flatwhite.jpg" },
  { id: "2", name_ar: "كرواسون باللوز", name_en: "Almond Croissant", name_fr: "Croissant aux amandes", description_ar: "مخبوزات طازجة", price: 26, category: "مخبوزات", image_url: "/demo/croissant.jpg" },
  { id: "3", name_ar: "ماتشا كلاود", name_en: "Matcha Cloud", name_fr: "Matcha", description_ar: "ماتشا يابانية", price: 42, category: "القهوة", image_url: "/demo/matcha.jpg" }
];

const INITIAL_ORDERS = [
  { id: "ORD-9381", tables: { table_number: "table_4" }, items: [{quantity: 2, name_ar: "فلات وايت"}], total_amount: 64, status: "pending", created_at: new Date().toISOString() }
];

// 🌟 الكود الجديد: تنظيف الذاكرة عند بدء جلسة جديدة (إغلاق وفتح المتصفح)
if (typeof window !== 'undefined') {
  const isSessionActive = document.cookie.includes('cafe_demo_session=active');
  
  if (!isSessionActive) {
    // هادي أول مرة كيتحل فيها المتصفح في هاد الجلسة -> نظف الذاكرة
    localStorage.removeItem('demo_products');
    localStorage.removeItem('demo_orders');
    
    // زرع الكوكيز ديال الجلسة (بدون تاريخ انتهاء باش يموت بوحدو ملي يتسد المتصفح)
    document.cookie = "cafe_demo_session=active; path=/";
  }
}

// دوال التحكم في LocalStorage
const getDemoData = (key: string, initial: any) => {
  if (typeof window === 'undefined') return initial;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : initial;
};

const setDemoData = (key: string, data: any) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
  window.dispatchEvent(new Event('demo-storage-update')); 
};

// 🌟 هوك المنتجات (Shared Products Hook)
export function useDemoProducts() {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    setProducts(getDemoData('demo_products', INITIAL_PRODUCTS));
    const sync = () => setProducts(getDemoData('demo_products', INITIAL_PRODUCTS));
    
    window.addEventListener('storage', sync); 
    window.addEventListener('demo-storage-update', sync); 
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