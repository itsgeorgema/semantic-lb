"use client";
import { motion, useReducedMotion } from "framer-motion";
import { MetricsSnapshot, LABEL_COLORS, LABEL_DISPLAY } from "@/types/traffic";

interface Props {
  snapshot: MetricsSnapshot;
  lastReasoning?: string;
  isActive?: boolean;
}

export function RouteCard({ snapshot, lastReasoning, isActive }: Props) {
  const reduceMotion = useReducedMotion();
  const color = LABEL_COLORS[snapshot.label];

  return (
    <motion.div
      layout
      whileHover={reduceMotion ? undefined : { y: -2 }}
      whileTap={reduceMotion ? undefined : { scale: 0.99 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className="interactive relative overflow-hidden rounded-2xl p-4"
      style={{
        background: isActive ? `${color}12` : "var(--bg-shell)",
        border: `1px solid ${isActive ? `${color}2a` : "var(--border)"}`,
        transition: "background 0.4s, border-color 0.4s",
      }}
    >
      {/* Left accent bar */}
      <motion.div
        className="absolute bottom-3 left-0 top-3 w-[3px] rounded-r-full"
        animate={{ opacity: isActive ? 1 : 0.35, scaleY: isActive ? 1 : 0.72 }}
        transition={{ type: "spring", stiffness: 220, damping: 24 }}
        style={{ background: color, transformOrigin: "center" }}
      />

      <div className="pl-3.5">
        {/* Top row: name + request count */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight" style={{ color }}>
              {LABEL_DISPLAY[snapshot.label]}
            </span>
            {isActive && (
              <span className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0"
                    style={{ background: color }} />
            )}
          </div>
          <motion.span
            key={snapshot.count}
            initial={{ scale: 1.25, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="tabular rounded-md px-2 py-0.5 font-mono text-[11px]"
            style={{
              background: "rgba(255,255,255,0.035)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
            }}
          >
            {snapshot.count} req
          </motion.span>
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-4">
          <div>
            <div className="tabular font-mono text-2xl font-semibold leading-none" style={{ color: "var(--text-primary)" }}>
              {snapshot.rps.toFixed(1)}
            </div>
            <div className="text-[10px] font-mono mt-1" style={{ color: "var(--text-muted)" }}>req / s</div>
          </div>
          <div className="w-px h-7 self-center flex-shrink-0" style={{ background: "var(--border)" }} />
          <div>
            <div className="tabular font-mono text-2xl font-semibold leading-none" style={{ color: "var(--text-primary)" }}>
              {snapshot.p99Ms}
            </div>
            <div className="text-[10px] font-mono mt-1" style={{ color: "var(--text-muted)" }}>p99 ms</div>
          </div>
        </div>

        {/* Last reasoning */}
        {lastReasoning && (
          <p className="text-[11px] font-mono mt-2.5 truncate" style={{ color: "var(--text-faint)" }}>
            {lastReasoning}
          </p>
        )}
      </div>
    </motion.div>
  );
}
