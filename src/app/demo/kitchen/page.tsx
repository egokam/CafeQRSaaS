"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "framer-motion";
import { type DemoOrder, useDemoOrders } from "@/lib/demoStore";

const TEAR_THRESHOLD = 92;
const TEAR_VELOCITY = 520;
const TEAR_DRAG_LIMIT = 150;

type FallingReceipt = DemoOrder & {
  fallKey: string;
  driftX: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
};

const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;

const getTableLabel = (order: DemoOrder) =>
  order.tables?.table_number?.replace("table_", "") || "POS";

const getItemName = (item: DemoOrder["items"][number]) =>
  item.name_en || item.name_ar || "Demo item";

export default function KitchenPrinter3D() {
  const { orders, updateOrders } = useDemoOrders();
  const [hangingReceipts, setHangingReceipts] = useState<DemoOrder[]>([]);
  const [fallenReceipts, setFallenReceipts] = useState<FallingReceipt[]>([]);
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());
  const [isTearing, setIsTearing] = useState(false);

  const dragY = useMotionValue(0);
  const receiptRotateX = useTransform(dragY, [0, TEAR_DRAG_LIMIT], [0, -13]);
  const receiptScale = useTransform(dragY, [0, TEAR_DRAG_LIMIT], [1, 1.015]);
  const receiptShadow = useTransform(
    dragY,
    [0, TEAR_DRAG_LIMIT],
    [
      "0 34px 70px rgba(0,0,0,0.55)",
      "0 58px 95px rgba(0,0,0,0.78)",
    ],
  );

  const queuedIdsRef = useRef<Set<string>>(new Set());
  const tearLockRef = useRef(false);
  const fallTimersRef = useRef<number[]>([]);

  const playSound = useCallback((type: "print" | "tear") => {
    const audio = new Audio(`/${type}.mp3`);
    audio.volume = type === "tear" ? 0.75 : 0.35;
    audio.play().catch(() => {});
  }, []);

  useEffect(() => {
    const queuedIds = queuedIdsRef.current;
    const acceptedOrders = orders.filter((order) => order.status === "accepted");
    const newOrders = acceptedOrders.filter(
      (order) => !processedIds.has(order.id) && !queuedIds.has(order.id),
    );

    if (newOrders.length === 0) return;

    newOrders.forEach((order) => queuedIds.add(order.id));

    const timer = window.setTimeout(() => {
      playSound("print");
      setProcessedIds((previousIds) => {
        const updatedIds = new Set(previousIds);
        newOrders.forEach((order) => updatedIds.add(order.id));
        return updatedIds;
      });
      setHangingReceipts((currentReceipts) => {
        const currentIds = new Set(currentReceipts.map((receipt) => receipt.id));
        const incomingReceipts = newOrders.filter((order) => !currentIds.has(order.id));
        return [...incomingReceipts, ...currentReceipts];
      });
    }, 80);

    return () => {
      window.clearTimeout(timer);
      newOrders.forEach((order) => queuedIds.delete(order.id));
    };
  }, [orders, playSound, processedIds]);

  useEffect(() => {
    const fallTimers = fallTimersRef.current;

    return () => {
      fallTimers.forEach((timer) => window.clearTimeout(timer));
      fallTimers.length = 0;
    };
  }, []);

  const handleTear = useCallback(() => {
    if (tearLockRef.current) return;

    const tornOrder = hangingReceipts[0];
    if (!tornOrder) return;

    tearLockRef.current = true;
    setIsTearing(true);
    playSound("tear");

    const fallKey = `${tornOrder.id}-${Date.now()}`;
    const fallingReceipt: FallingReceipt = {
      ...tornOrder,
      fallKey,
      driftX: randomBetween(-90, 90),
      rotateX: randomBetween(22, 42),
      rotateY: randomBetween(-18, 18),
      rotateZ: randomBetween(-18, 18),
    };

    setHangingReceipts((currentReceipts) =>
      currentReceipts.filter((receipt) => receipt.id !== tornOrder.id),
    );
    setFallenReceipts((currentReceipts) => [fallingReceipt, ...currentReceipts].slice(0, 4));
    updateOrders(
      orders.map((order) =>
        order.id === tornOrder.id
          ? { ...order, status: "ready", updated_at: new Date().toISOString() }
          : order,
      ),
    );

    animate(dragY, TEAR_DRAG_LIMIT, { duration: 0.12 }).then(() => dragY.set(0));

    const unlockTimer = window.setTimeout(() => {
      tearLockRef.current = false;
      setIsTearing(false);
      dragY.set(0);
    }, 520);

    const removeTimer = window.setTimeout(() => {
      setFallenReceipts((currentReceipts) =>
        currentReceipts.filter((receipt) => receipt.fallKey !== fallKey),
      );
    }, 2600);

    fallTimersRef.current.push(unlockTimer, removeTimer);
  }, [dragY, hangingReceipts, orders, playSound, updateOrders]);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (tearLockRef.current) return;

    if (info.offset.y >= TEAR_THRESHOLD || info.velocity.y >= TEAR_VELOCITY) {
      handleTear();
      return;
    }

    animate(dragY, 0, {
      type: "spring",
      stiffness: 420,
      damping: 32,
    });
  };

  const activeReceipt = hangingReceipts[0] || null;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#09090b] text-white select-none">
      <div className="absolute inset-x-0 top-0 z-30 h-8 border-b border-zinc-800 bg-gradient-to-b from-black via-zinc-950 to-zinc-900 shadow-[0_18px_40px_rgba(0,0,0,0.95)]">
        <div className="mx-auto mt-[18px] h-2 w-[360px] max-w-[78vw] rounded-full bg-black shadow-[inset_0_2px_8px_rgba(255,255,255,0.08),0_4px_14px_rgba(0,0,0,0.9)]" />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-16 z-20 text-center">
        <h1 className="mb-2 font-mono text-sm uppercase tracking-[0.34em] text-zinc-500">
          Kitchen Print
        </h1>
        {activeReceipt ? (
          <p className="font-semibold text-amber-500">Pull downwards to tear the receipt</p>
        ) : (
          <p className="font-semibold text-zinc-700">Awaiting Orders...</p>
        )}
      </div>

      <div
        className="absolute inset-0 z-10 flex justify-center pt-28"
        style={{ perspective: "1300px" }}
      >
        <AnimatePresence mode="popLayout">
          {activeReceipt && (
            <motion.div
              key={activeReceipt.id}
              drag={isTearing ? false : "y"}
              dragConstraints={{ top: 0, bottom: TEAR_DRAG_LIMIT }}
              dragElastic={0.035}
              dragMomentum={false}
              onDragEnd={handleDragEnd}
              style={{
                y: dragY,
                rotateX: receiptRotateX,
                scale: receiptScale,
                boxShadow: receiptShadow,
                transformStyle: "preserve-3d",
                touchAction: "none",
              }}
              initial={{ y: -460, rotateX: -18, opacity: 0 }}
              animate={{ y: 0, rotateX: 0, opacity: 1 }}
              exit={{
                y: 210,
                rotateX: -22,
                rotateZ: -4,
                opacity: 0,
                transition: { duration: 0.22, ease: "easeIn" },
              }}
              transition={{ type: "spring", stiffness: 190, damping: 24 }}
              className="relative cursor-grab active:cursor-grabbing"
            >
              <ReceiptPaper order={activeReceipt} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="pointer-events-none absolute inset-0 z-0 flex justify-center pt-28">
        <AnimatePresence>
          {fallenReceipts.map((receipt) => (
            <motion.div
              key={receipt.fallKey}
              initial={{ y: 24, x: 0, rotateX: -14, rotateY: 0, rotateZ: 0, opacity: 0.98 }}
              animate={{
                y: 820,
                x: receipt.driftX,
                rotateX: receipt.rotateX,
                rotateY: receipt.rotateY,
                rotateZ: receipt.rotateZ,
                opacity: 0,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.45, ease: "easeIn" }}
              className="absolute"
              style={{ transformStyle: "preserve-3d" }}
            >
              <ReceiptPaper order={receipt} compact />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black via-black/65 to-transparent" />
    </div>
  );
}

function ReceiptPaper({ order, compact = false }: { order: DemoOrder; compact?: boolean }) {
  const visibleItems = compact ? order.items.slice(0, 3) : order.items;

  return (
    <div
      className={[
        "relative origin-top overflow-hidden bg-[#fffdf7] px-6 py-6 font-mono text-zinc-950",
        "ring-1 ring-black/10 [backface-visibility:hidden]",
        compact ? "w-[260px] min-h-[340px]" : "w-[310px] min-h-[440px]",
      ].join(" ")}
      style={{
        clipPath:
          "polygon(0 0,100% 0,100% 96%,97% 98%,94% 96%,91% 98%,88% 96%,85% 98%,82% 96%,79% 98%,76% 96%,73% 98%,70% 96%,67% 98%,64% 96%,61% 98%,58% 96%,55% 98%,52% 96%,49% 98%,46% 96%,43% 98%,40% 96%,37% 98%,34% 96%,31% 98%,28% 96%,25% 98%,22% 96%,19% 98%,16% 96%,13% 98%,10% 96%,7% 98%,4% 96%,0 98%)",
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-3 opacity-70"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(0,0,0,0.18) 0 8px, transparent 8px 16px)",
        }}
      />
      <div className="absolute inset-y-0 left-0 w-7 bg-gradient-to-r from-black/[0.08] to-transparent" />
      <div className="absolute inset-y-0 right-0 w-5 bg-gradient-to-l from-black/[0.06] to-transparent" />

      <div className="relative">
        <div className="mb-4 text-center">
          <p className="text-lg font-black tracking-tight">Qerve Demo</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.32em] text-zinc-500">
            Kitchen Receipt
          </p>
        </div>

        <div className="mb-4 border-y border-dashed border-zinc-400 py-3 text-[11px] leading-5">
          <div className="flex justify-between gap-4">
            <span className="font-semibold">Table</span>
            <span>{getTableLabel(order)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="font-semibold">Order</span>
            <span>#{order.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="font-semibold">Status</span>
            <span>{order.status.toUpperCase()}</span>
          </div>
        </div>

        <div className="space-y-3">
          {visibleItems.map((item) => (
            <div key={`${item.id}-${getItemName(item)}`} className="flex items-start gap-3">
              <span className="min-w-8 text-sm font-black">{item.quantity}x</span>
              <span className="flex-1 text-sm font-bold leading-tight">{getItemName(item)}</span>
            </div>
          ))}
          {compact && order.items.length > visibleItems.length && (
            <p className="text-xs font-semibold text-zinc-500">
              +{order.items.length - visibleItems.length} more
            </p>
          )}
        </div>

        <div className="mt-6 border-t border-dashed border-zinc-400 pt-4 text-center">
          <p className="text-base font-black">{order.total_amount.toFixed(2)} MAD</p>
          <p className="mt-5 text-[9px] uppercase tracking-[0.28em] text-zinc-500">
            Powered by Qerve
          </p>
        </div>
      </div>
    </div>
  );
}
