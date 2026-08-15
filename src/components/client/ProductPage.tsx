"use client";

import { useState, useEffect } from "react";
import type { Product, Lang } from "@/app/[cafeSlug]/[tableId]/page";
import { useCart } from "@/store/useCart";
import { ArrowLeft } from "lucide-react";

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

  const [quantity, setQuantity] = useState(1);
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const calculateExtrasTotal = () => {
    let total = 0;
    const groups = product.modifier_groups || [];

    Object.entries(selections).forEach(([optionId, qty]) => {
      groups.forEach((group: any) => {
        // قراءة المصفوفة بالاسم الصحيح القادم من قاعدة البيانات
        const optionsArray = group.modifier_options || group.options || [];
        const option = optionsArray.find((opt: any) => opt.id === optionId);
        if (option) {
          total += Number(option.price_adjustment) * qty;
        }
      });
    });

    return total;
  };

  const extrasTotal = calculateExtrasTotal();
  const unitPrice = Number(product.price) + extrasTotal;
  const finalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    // 🌟 1. استخراج الأسماء الأساسية للمنتج بجميع اللغات
    const baseNameAr = product.name_ar || product.name_en || "";
    const baseNameEn = product.name_en || product.name_ar || "";
    const baseNameFr = product.name_fr || product.name_en || product.name_ar || "";

    // 🌟 2. دالة ذكية تبني نص الإضافات بناءً على اللغة الممررة لها
    const getModifiersText = (lang: string) => {
      const names: string[] = [];
      const groups = product.modifier_groups || [];
      
      Object.entries(selections).forEach(([optionId, qty]) => {
        groups.forEach((group: any) => {
          const optionsArray = group.modifier_options || group.options || [];
          const option = optionsArray.find((opt: any) => opt.id === optionId);
          if (option) {
            let optName = "";
            if (lang === 'ar') optName = option.name_ar || option.name_en || option.name_fr || "";
            else if (lang === 'fr') optName = option.name_fr || option.name_en || option.name_ar || "";
            else optName = option.name_en || option.name_ar || option.name_fr || "";
            
            names.push(qty > 1 ? `${optName} (x${qty})` : optName);
          }
        });
      });
      const separator = lang === 'ar' ? '، ' : ', ';
      return names.length > 0 ? ` (+ ${names.join(separator)})` : "";
    };

    const selectionsHash = Object.entries(selections)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([k, v]) => `${k}:${v}`)
      .join("-");
    
    const cartItemId = selectionsHash ? `${product.id}-${selectionsHash}` : product.id;

    // 🌟 3. إرسال الترجمات الدقيقة كلٌ في حقلها ليتمكن الكاشير من التبديل بينها بحرية
    addItem({
      id: cartItemId,
      product_id: product.id,
      name_ar: baseNameAr + getModifiersText("ar"),
      name_en: baseNameEn + getModifiersText("en"),
      name_fr: baseNameFr + getModifiersText("fr"),
      price: unitPrice,
      quantity: quantity,
      image_url: product.image_url || "",
      modifiers: selections,
    } as any);

    handleClose();
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;

    if (scrollTop > 10 && !isExpanded) {
      setIsExpanded(true);
    } else if (scrollTop === 0 && isExpanded) {
      setIsExpanded(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col justify-end bg-black/40 backdrop-blur-md transition-opacity duration-300 ease-in-out ${isVisible ? "opacity-100" : "opacity-0"
        }`}
    >
      <div
        className={`relative flex w-full flex-col overflow-hidden rounded-t-[2.5rem] bg-white shadow-2xl transition-all duration-300 ease-in-out ${isVisible ? "translate-y-0" : "translate-y-full"
          } ${isExpanded ? "h-[calc(100dvh-20px)]" : "h-[550px]"}`}
      >

        <div className="absolute inset-x-0 top-0 z-20 flex flex-col pointer-events-none">
          <div className="flex items-center bg-white px-5 py-4 pointer-events-auto">
            <button
              onClick={handleClose}
              className="flex items-center justify-center p-1 text-black active:scale-95 transition-transform"
            >
              <ArrowLeft size={28} strokeWidth={2.5} />
            </button>
          </div>
          <div className="h-6 w-full bg-gradient-to-b from-white from-50% to-transparent -mt-[1px]"></div>
        </div>

        <div
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto pt-20 pb-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          <Overview product={product} activeLang={activeLang} />

          <Modifiers
            quantity={quantity}
            setQuantity={setQuantity}
            modifiers={product.modifier_groups || []}
            selections={selections}
            setSelections={setSelections}
          />

          <Tail finalPrice={finalPrice} onAddToCart={handleAddToCart} />
        </div>

      </div>
    </div>
  );
}