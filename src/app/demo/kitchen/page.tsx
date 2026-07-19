// src/app/demo/kitchen/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDemoOrders } from "@/lib/demoStore";

const formatMAD = (price: number) => `${Number(price).toFixed(2)} MAD`;

export default function KitchenPrinterDemo() {
  const { orders, updateOrders } = useDemoOrders();
  
  const [hangingReceipts, setHangingReceipts] = useState<any[]>([]);
  const [fallenReceipts, setFallenReceipts] = useState<any[]>([]);
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());

  const playSound = (type: "print" | "tear") => {
    const audio = new Audio(`/${type}.mp3`);
    audio.volume = type === "tear" ? 0.8 : 0.4;
    audio.play().catch(() => {}); // صامت إذا لم توجد الملفات
  };

  useEffect(() => {
    // جلب الطلبات المقبولة فقط من الكاشير
    const acceptedOrders = orders.filter(o => o.status === 'accepted');
    const newOrders = acceptedOrders.filter(o => !processedIds.has(o.id));

    if (newOrders.length > 0) {
      playSound("print");
      
      setProcessedIds(prev => {
        const updated = new Set(prev);
        newOrders.forEach(o => updated.add(o.id));
        return updated;
      });

      // وضع الفواتير الجديدة في الأعلى لدفع القديمة للأسفل
      setHangingReceipts(prev => [...newOrders, ...prev]);
    }
  }, [orders, processedIds]);

  const handleTear = (index: number) => {
    playSound("tear");
    
    // سحب الورقة يقطعها هي وكل ما تحتها
    const torn = hangingReceipts.slice(index);
    const remaining = hangingReceipts.slice(0, index);

    setHangingReceipts(remaining);
    setFallenReceipts(prev => [...torn, ...prev]);

    // تحويل حالة الطلبات المقطوعة إلى "جاهزة"
    const tornIds = torn.map(t => t.id);
    const updatedOrders = orders.map(o => 
      tornIds.includes(o.id) ? { ...o, status: 'ready' } : o
    );
    updateOrders(updatedOrders);

    // إخفاء الفواتير الساقطة بعد فترة
    setTimeout(() => {
      setFallenReceipts(prev => prev.filter(r => !torn.find(t => t.id === r.id)));
    }, 2000);
  };

  return (
    <div className="relative min-h-screen bg-[#121212] overflow-hidden flex flex-col items-center select-none font-mono">
      
      {/* 🖨️ Hardware: هيكل الطابعة من الأعلى */}
      <div className="absolute top-0 w-full flex justify-center z-50 pointer-events-none">
        <div className="w-[340px] h-16 bg-gradient-to-b from-zinc-800 to-zinc-950 rounded-b-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.8)] border-b-2 border-zinc-700 flex justify-center items-end pb-2">
          {/* فتحة خروج الورق */}
          <div className="w-[280px] h-2 bg-black rounded-full shadow-inner opacity-80" />
        </div>
      </div>

      {/* 📃 منطقة الفواتير المعلقة في الطابعة */}
      <div className="relative z-40 mt-14 w-[280px] flex flex-col items-center pointer-events-auto">
        <AnimatePresence mode="popLayout">
          {hangingReceipts.map((order, index) => (
            <Receipt
              key={`hanging-${order.id}`}
              order={order}
              index={index}
              isBottom={index === hangingReceipts.length - 1}
              onTear={() => handleTear(index)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* 🍂 منطقة الفواتير المتساقطة المقطوعة */}
      <div className="absolute top-0 z-30 mt-14 w-[280px] flex flex-col items-center pointer-events-none">
        <AnimatePresence>
          {fallenReceipts.map((order) => (
            <FallenReceipt key={`fallen-${order.id}`} order={order} />
          ))}
        </AnimatePresence>
      </div>

      {hangingReceipts.length > 0 ? (
        <div className="absolute bottom-10 text-zinc-500 text-sm animate-pulse z-10 font-sans pointer-events-none">
          ↓ Drag receipt downwards to tear it off ↓
        </div>
      ) : (
        <div className="absolute top-1/2 -translate-y-1/2 text-zinc-700 text-sm font-bold font-sans pointer-events-none">
          Waiting for new orders...
        </div>
      )}
    </div>
  );
}

// ==========================================
// 🌟 المكون الفرعي: الفاتورة القابلة للسحب
// ==========================================
function Receipt({ order, index, isBottom, onTear }: { order: any, index: number, isBottom: boolean, onTear: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      // فيزياء السحب
      drag="y"
      dragDirectionLock
      dragConstraints={{ top: 0, bottom: 0 }} 
      dragElastic={0.08} 
      whileDrag={{ scale: 1.02, rotateZ: (index % 2 === 0 ? 1 : -1) }} 
      onDragEnd={(e, info) => {
        if (info.offset.y > 60 || info.velocity.y > 400) {
          onTear();
        }
      }}
      className={`w-full bg-[#fdfdfc] text-zinc-900 px-5 pt-6 pb-8 shadow-xl relative cursor-grab active:cursor-grabbing
        ${index > 0 ? 'border-t-2 border-dashed border-zinc-300' : ''} 
      `}
      style={{
        boxShadow: isBottom ? '0px 15px 20px -5px rgba(0,0,0,0.5)' : 'none',
      }}
    >
      {/* جسر التمزيق (Perforation) */}
      {index > 0 && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-zinc-200 text-zinc-400 text-[8px] px-2 rounded-full uppercase tracking-widest font-sans font-bold">
          Tear Here
        </div>
      )}

      <div className="text-center border-b-2 border-zinc-300 border-dashed pb-3 mb-3">
        <h2 className="text-xl font-black uppercase tracking-tighter">Kitchen Ticket</h2>
        <p className="text-sm font-bold mt-1">Table: <span className="text-xl">{order.tables?.table_number?.replace('table_', '')}</span></p>
        <p className="text-[10px] text-zinc-500 mt-1">#{order.id.split('-')[0]}</p>
      </div>

      <div className="space-y-2 mb-4">
        {order.items.map((item: any, i: number) => (
          <div key={i} className="flex justify-between items-start text-sm">
            <span className="font-bold flex-1 pr-2 leading-tight">
              {item.name_en || item.name_ar}
            </span>
            <span className="font-black text-lg">x{item.quantity}</span>
          </div>
        ))}
      </div>

      <div className="text-center border-t-2 border-zinc-300 border-dashed pt-2">
        <p className="font-bold">{formatMAD(order.total_amount)}</p>
      </div>
    </motion.div>
  );
}

// ==========================================
// 🌟 المكون الفرعي: الفاتورة الساقطة المقطوعة
// ==========================================
function FallenReceipt({ order }: { order: any }) {
  // دوران عشوائي لمحاكاة سقوط الورقة
  const randomRotation = Math.random() * 30 - 15;

  return (
    <motion.div
      initial={{ opacity: 1, y: 0, rotateZ: 0 }}
      animate={{ opacity: 0, y: "100vh", rotateZ: randomRotation }}
      transition={{ duration: 1.5, ease: "easeIn" }}
      className="w-full bg-[#fdfdfc] text-zinc-900 px-5 pt-6 pb-8 shadow-2xl border-t-[1px] border-zinc-300 absolute"
    >
      <div className="text-center border-b-2 border-zinc-300 border-dashed pb-3 mb-3 opacity-50">
        <h2 className="text-xl font-black uppercase tracking-tighter">Kitchen Ticket</h2>
        <p className="text-sm font-bold mt-1">Table: <span className="text-xl">{order.tables?.table_number?.replace('table_', '')}</span></p>
      </div>
      <div className="space-y-2 mb-4 opacity-50">
        {order.items.map((item: any, i: number) => (
          <div key={i} className="flex justify-between items-start text-sm">
            <span className="font-bold">{item.name_en || item.name_ar}</span>
            <span className="font-black">x{item.quantity}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}