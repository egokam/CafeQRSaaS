"use client";

import { motion } from "framer-motion";

/**
 * Full-screen, high-performance background container.
 *
 * 3D SLOT:
 * Drop your Spline embed inside the `#spline-slot` container below. e.g.
 *
 *   import Spline from "@splinetool/react-spline";
 *   <Spline scene="https://prod.spline.design/XXXX/scene.splinecode" />
 *
 * The slot is a full-width / full-height absolute layer. The animated
 * "neon" glow blobs underneath act as a graceful fallback / ambience
 * until the 3D scene is plugged in. Purely decorative — hidden from AT.
 */
export function Background3D() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Ambient neon glow fallback layer */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.035),transparent_70%)]" />

      <motion.div
        className="absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-amber-500/20 blur-[120px]"
        animate={{ x: [0, 60, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 -right-24 h-[24rem] w-[24rem] rounded-full bg-orange-600/20 blur-[120px]"
        animate={{ x: [0, -50, 0], y: [0, 60, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 left-1/3 h-[22rem] w-[22rem] rounded-full bg-amber-300/10 blur-[120px]"
        animate={{ x: [0, 40, 0], y: [0, -40, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* === SPLINE 3D EMBED SLOT ===
          Full-width / full-height layer. Plug your <Spline /> scene here.
          pointer-events-auto lets the 3D scene receive cursor interaction. */}
      <div
        id="spline-slot"
        className="pointer-events-auto absolute inset-0 h-full w-full"
      />

      {/* Vignette to keep foreground content legible over the 3D scene */}
      <div className="absolute inset-0 -z-0 bg-gradient-to-b from-zinc-950/40 via-transparent to-zinc-950/80" />
    </div>
  );
}
