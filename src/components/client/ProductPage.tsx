"use client";

import { useState } from "react";
import type { Product, Lang } from "@/app/[cafeSlug]/[tableId]/page";
import { useCart } from "@/store/useCart";

// سنقوم بإنشاء هذه المكونات في الخطوات القادمة
import Overview from "@/components/client/ProductPage/Overview";
import Modifiers from "@/components/client/ProductPage/Modifiers";
import Tail from "@/components/client/ProductPage/Tail";

interface ProductPageProps {
  product: Product;
  activeLang: Lang;
  onClose: () => void;
}

export default function ProductPage({ product, activeLang, onClose }: ProductPageProps) {
  const { addItem } = useCart();
  
  // States لإدارة تفضيلات العميل
  const [quantity, setQuantity] = useState(1);
  const [spicyLevel, setSpicyLevel] = useState(0); // 0: Mild, 1: Medium, 2: Hot
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);

  // بيانات وهمية للإضافات مطابقة للتصميم
  const EXTRAS = [
    { id: "onion", name: "Onion", price: 0 },
    { id: "cheese", name: "Extra Cheese", price: 5 },
    { id: "fries", name: "Extra Fries", price: 10 },
  ];

  // حساب إجمالي سعر الإضافات المحددة
  const extrasTotal = selectedExtras.reduce((sum, extraId) => {
    const extra = EXTRAS.find(e => e.id === extraId);
    return sum + (extra?.price || 0);
  }, 0);

  // السعر النهائي = (السعر الأساسي + سعر الإضافات) × الكمية
  const finalPrice = (Number(product.price) + extrasTotal) * quantity;

  const handleAddToCart = () => {
    const productName =
      activeLang === "ar" && product.name_ar
        ? product.name_ar
        : activeLang === "fr" && product.name_fr
        ? product.name_fr
        : product.name_en || product.name_fr || product.name_ar || "";

    // إضافة التعديلات إلى اسم المنتج ليراها المطبخ
    const extrasText = selectedExtras.length > 0 
      ? ` (+ ${selectedExtras.map(id => EXTRAS.find(e => e.id === id)?.name).join(", ")})` 
      : "";

    addItem({
      id: `${product.id}-${selectedExtras.join("-")}-${spicyLevel}`,
      name_ar: (product.name_ar || productName) + extrasText,
      name_en: (product.name_en || productName) + extrasText,
      name_fr: (product.name_fr || productName) + extrasText,
      price: Number(product.price) + extrasTotal,
      quantity: quantity,
      image_url: product.image_url || "",
    } as any);

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-black/20 backdrop-blur-md animate-in fade-in duration-200">
      <div className="mt-12 flex flex-1 flex-col overflow-hidden rounded-t-[2.5rem] bg-white shadow-2xl animate-in slide-in-from-bottom-full duration-300">
        
        {/* المحتوى القابل للتمرير */}
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <Overview product={product} activeLang={activeLang} onClose={onClose} />
          
          <Modifiers 
            quantity={quantity}
            setQuantity={setQuantity}
            spicyLevel={spicyLevel}
            setSpicyLevel={setSpicyLevel}
            selectedExtras={selectedExtras}
            setSelectedExtras={setSelectedExtras}
            availableExtras={EXTRAS}
          />
        </div>

        {/* الشريط السفلي الثابت */}
        <Tail finalPrice={finalPrice} onAddToCart={handleAddToCart} />
      </div>
    </div>
  );
}