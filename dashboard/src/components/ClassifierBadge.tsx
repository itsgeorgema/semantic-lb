"use client";
import { motion, AnimatePresence } from "framer-motion";
import { RouteLabel, LABEL_COLORS, LABEL_DISPLAY } from "@/types/traffic";

interface Props {
  label: RouteLabel;
  confidence: number;
  reasoning: string;
}

const SIZE = 148;
const STROKE = 10;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

const ROUTE_DESC: Record<RouteLabel, string> = {
  general: "Standard capacity — balanced latency and throughput",
  "high-compute": "GPU-optimized pool for complex inference tasks",
  "fast-path": "Low-latency pool for simple, lightweight requests",
};

export function ClassifierBadge({ label, confidence, reasoning }: Props) {
  const color = LABEL_COLORS[label];
  const dash = CIRC * confidence;

  return (
    <div className="flex w-full flex-col items-center gap-5">

      {/* Confidence ring */}
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90" style={{ overflow: "visible" }}>
          {/* Track ring */}
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R}
                  fill="none" stroke="#323832" strokeWidth={STROKE} />
          {/* Progress arc */}
          <motion.circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            initial={{ strokeDashoffset: CIRC }}
            animate={{ strokeDashoffset: CIRC - dash }}
            transition={{ duration: 0.65, ease: [0.34, 1.56, 0.64, 1] }}
            style={{ filter: `drop-shadow(0 1px 0 ${color}55)` }}
          />
        </svg>

        {/* Center readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            key={`${label}-${Math.round(confidence * 100)}`}
            initial={{ opacity: 0, scale: 0.75 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className="tabular font-mono text-[30px] font-semibold leading-none"
            style={{ color }}
          >
            {Math.round(confidence * 100)}%
          </motion.span>
          <span className="mt-1 font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>
            confidence
          </span>
        </div>
      </div>

      {/* Route label + description */}
      <AnimatePresence mode="wait">
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
          className="flex w-full flex-col items-center gap-2"
        >
          {/* Route badge */}
          <div className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5"
               style={{
                 background: `${color}14`,
                 border: `1px solid ${color}30`,
               }}>
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
            <span className="text-sm font-semibold" style={{ color }}>
              {LABEL_DISPLAY[label]}
            </span>
          </div>

          {/* Pool description */}
          <p className="px-2 text-center text-xs leading-relaxed"
             style={{ color: "var(--text-muted)" }}>
            {ROUTE_DESC[label]}
          </p>

          {/* Reasoning snippet */}
          <p className="rounded-xl px-3 py-3 text-center font-mono text-[11px] leading-relaxed"
             style={{ color: "var(--text-muted)", background: "rgba(255,255,255,0.025)", border: "1px solid var(--border)" }}>
            &ldquo;{reasoning.slice(0, 90)}{reasoning.length > 90 ? "…" : ""}&rdquo;
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
