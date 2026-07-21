"use client";

import { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, ContactShadows, Text } from "@react-three/drei";
import { motion as motion3d } from "framer-motion-3d";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { useDemoOrders } from "@/lib/demoStore";

export default function KitchenPrinter3D() {
  const { orders, updateOrders } = useDemoOrders();
  const [hangingReceipts, setHangingReceipts] = useState<any[]>([]);
  const [fallenReceipts, setFallenReceipts] = useState<any[]>([]);
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());

  // 🌟 إحداثيات السحب المخفية
  const dragY = useMotionValue(0);

  const playSound = (type: "print" | "tear") => {
    const audio = new Audio(`/${type}.mp3`);
    audio.volume = type === "tear" ? 0.8 : 0.4;
    audio.play().catch(() => {});
  };

  useEffect(() => {
    const acceptedOrders = orders.filter(o => o.status === 'accepted');
    const newOrders = acceptedOrders.filter(o => !processedIds.has(o.id));

    if (newOrders.length > 0) {
      playSound("print");
      setProcessedIds(prev => {
        const updated = new Set(prev);
        newOrders.forEach(o => updated.add(o.id));
        return updated;
      });
      setHangingReceipts(prev => [...newOrders, ...prev]);
    }
  }, [orders, processedIds]);

  const handleTear = () => {
    if (hangingReceipts.length === 0) return;
    playSound("tear");
    
    const tornOrder = hangingReceipts[0];
    
    setHangingReceipts(prev => prev.slice(1));
    setFallenReceipts(prev => [tornOrder, ...prev]);
    dragY.set(0); 

    const updatedOrders = orders.map(o => 
      o.id === tornOrder.id ? { ...o, status: 'ready' } : o
    );
    updateOrders(updatedOrders);

    setTimeout(() => {
      setFallenReceipts(prev => prev.filter(r => r.id !== tornOrder.id));
    }, 3000);
  };

  return (
    <div className="relative w-full h-screen bg-[#0a0a0c] overflow-hidden select-none cursor-grab active:cursor-grabbing">
      
      {/* 🔪 الشق العلوي البسيط الذي تخرج منه الورقة */}
      <div className="absolute top-0 w-full h-6 bg-gradient-to-b from-black to-zinc-950 border-b border-zinc-800 shadow-[0_10px_30px_rgba(0,0,0,1)] z-50 flex justify-center items-end pb-1">
        <div className="w-[300px] h-2 bg-black rounded-full shadow-inner opacity-90" />
      </div>

      {/* 🌟 واجهة السحب المخفية لالتقاط الماوس */}
      <div className="absolute inset-0 z-50 flex justify-center pt-20">
        {hangingReceipts.length > 0 && (
          <motion.div
            drag="y"
            dragDirectionLock
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            style={{ y: dragY, width: 300, height: 450 }}
            onDragEnd={(e, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                handleTear();
              }
            }}
            className="opacity-0" 
          />
        )}
      </div>

      {/* تعليمات UI */}
      <div className="absolute top-12 w-full text-center z-40 pointer-events-none">
        <h1 className="text-zinc-500 font-mono tracking-widest text-sm uppercase mb-2">Kitchen Display</h1>
        {hangingReceipts.length > 0 ? (
          <p className="text-amber-500 font-bold animate-pulse">Pull downwards to tear the receipt</p>
        ) : (
          <p className="text-zinc-700 font-bold">Awaiting Orders...</p>
        )}
      </div>

      {/* 🎮 محرك الـ WebGL */}
      <Canvas camera={{ position: [0, 1, 8], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <spotLight position={[0, 6, 5]} angle={0.4} penumbra={1} intensity={2.5} castShadow />
        
        <Environment preset="city" />

        {/* 📃 الفاتورة المعلقة تتأثر بالماوس */}
        <AnimatePresence>
          {hangingReceipts.length > 0 && (
            <HangingReceipt3D 
              order={hangingReceipts[0]} 
              dragY={dragY} 
            />
          )}
        </AnimatePresence>

        {/* 🍂 الفواتير المقطوعة */}
        {fallenReceipts.map(order => (
          <FallenReceipt3D key={`fallen-${order.id}`} order={order} />
        ))}

        {/* ظل تفاعلي على الأرضية */}
        <ContactShadows position={[0, -5, 0]} opacity={0.5} scale={20} blur={2.5} far={10} />
      </Canvas>
    </div>
  );
}

// ==========================================
// 📃 الفاتورة المعلقة 3D (تتأثر بسحب الماوس)
// ==========================================
function HangingReceipt3D({ order, dragY }: { order: any, dragY: any }) {
  // الفاتورة تتدلى من أعلى الشاشة (y = 4.5)
  const yPosition = useTransform(dragY, [0, 300], [4.5, 2.5]);
  const zPosition = useTransform(dragY, [0, 300], [0, 1.5]);
  const rotateX = useTransform(dragY, [0, 300], [0, -Math.PI / 5]); // تنحني للأمام قليلاً عند السحب

  return (
    <motion3d.group
      position-y={yPosition}
      position-z={zPosition}
      rotation-x={rotateX}
      initial={{ scaleY: 0, y: 5.5, opacity: 0 }}
      animate={{ scaleY: 1, opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      <mesh castShadow receiveShadow position={[0, -2, 0]}>
        <planeGeometry args={[3.2, 4.5]} />
        <meshStandardMaterial color="#fdfdfc" roughness={0.8} />
      </mesh>

      <group position={[0, -0.2, 0.01]}>
        <Text position={[0, 0, 0]} fontSize={0.28} color="#000000" anchorY="top" maxWidth={2.8} textAlign="center" font="/fonts/Inter-Bold.ttf">
          KITCHEN TICKET
        </Text>
        
        <Text position={[0, -0.5, 0]} fontSize={0.16} color="#333333" anchorY="top">
          {`Table: ${order.tables?.table_number?.replace('table_', '')}  |  #${order.id.split('-')[0]}`}
        </Text>

        {/* خط منقط */}
        <Text position={[0, -0.8, 0]} fontSize={0.15} color="#666666" anchorY="top">
          -------------------------
        </Text>

        <Text position={[-1.3, -1.1, 0]} fontSize={0.2} color="#000000" anchorX="left" anchorY="top" maxWidth={2.6} lineHeight={1.5}>
          {order.items.map((item: any) => `${item.quantity}x ${item.name_en || item.name_ar}`).join('\n')}
        </Text>

        <Text position={[0, -3.8, 0]} fontSize={0.15} color="#666666" anchorY="top">
          -------------------------
        </Text>
      </group>
    </motion3d.group>
  );
}

// ==========================================
// 🍂 الفاتورة المتساقطة 3D
// ==========================================
function FallenReceipt3D({ order }: { order: any }) {
  const randomRotateX = (Math.random() - 0.5) * Math.PI * 2;
  const randomRotateY = (Math.random() - 0.5) * Math.PI * 2;
  const randomRotateZ = (Math.random() - 0.5) * Math.PI;

  return (
    <motion3d.group
      initial={{ y: 2.5, z: 1.5, rotateX: -Math.PI / 5 }}
      animate={{ 
        y: -12, 
        z: 4, 
        rotateX: randomRotateX, 
        rotateY: randomRotateY, 
        rotateZ: randomRotateZ 
      }}
      transition={{ duration: 2.5, ease: "easeIn" }}
    >
      <mesh castShadow receiveShadow>
        <planeGeometry args={[3.2, 4.5]} />
        <meshStandardMaterial color="#ececec" roughness={0.8} />
      </mesh>

      <group position={[0, 1.8, 0.01]}>
        <Text position={[0, 0, 0]} fontSize={0.28} color="#000000" anchorY="top">
          KITCHEN TICKET
        </Text>
        <Text position={[0, -0.5, 0]} fontSize={0.16} color="#333333" anchorY="top">
          {`Table: ${order.tables?.table_number?.replace('table_', '')}`}
        </Text>
      </group>
    </motion3d.group>
  );
}