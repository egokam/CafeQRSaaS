"use client";

import { useState, type ComponentType, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

export type SandboxView = {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  /** The content rendered inside the ViewPort. Inject any real component here. */
  content: ReactNode;
};

type SandboxProps = {
  views: SandboxView[];
  tabsLabel: string;
  /** Address-bar style label shown in the window chrome. */
  url?: string;
};

/**
 * Sandbox — a reusable "application shell" that renders injected views.
 *
 * It is intentionally content-agnostic: it only owns the window chrome,
 * the tab switcher (Framer Motion `layoutId` pill) and the animated
 * ViewPort (`AnimatePresence`). Pass real components via `views[].content`.
 */
export function Sandbox({
  views,
  tabsLabel,
  url = "app.cafeqr.io",
}: SandboxProps) {
  const [activeId, setActiveId] = useState(views[0]?.id);
  const active = views.find((v) => v.id === activeId) ?? views[0];

  return (
    <div className="mx-auto w-full max-w-5xl">
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/40 backdrop-blur-xl"
      >
        {/* top sheen */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

        {/* ---- macOS window chrome ---- */}
        <div className="flex items-center gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-3">
          <div className="flex items-center gap-2" aria-hidden="true">
            <span className="h-3 w-3 rounded-full bg-red-400/90" />
            <span className="h-3 w-3 rounded-full bg-amber-400/90" />
            <span className="h-3 w-3 rounded-full bg-emerald-400/90" />
          </div>
          <div className="mx-auto flex max-w-xs flex-1 items-center justify-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="truncate text-xs text-zinc-400">{url}</span>
          </div>
          <div className="h-3 w-3" aria-hidden="true" />
        </div>

        {/* ---- tab switcher ---- */}
        <div
          role="tablist"
          aria-label={tabsLabel}
          className="flex flex-wrap items-center gap-1 border-b border-white/10 bg-white/[0.02] p-2"
        >
          {views.map((view) => {
            const isActive = view.id === active?.id;
            const Icon = view.icon;
            return (
              <button
                key={view.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveId(view.id)}
                className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-zinc-950"
                    : "text-zinc-400 hover:text-zinc-100"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="sandbox-tab-pill"
                    className="absolute inset-0 rounded-xl bg-amber-400"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className="relative z-10 h-4 w-4" />
                <span className="relative z-10">{view.label}</span>
              </button>
            );
          })}
        </div>

        {/* ---- ViewPort (dynamic content shell) ---- */}
        <div className="relative min-h-[420px] bg-gradient-to-b from-white/[0.02] to-transparent p-4 sm:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={active?.id}
              initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -16, filter: "blur(4px)" }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              {active?.content}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
