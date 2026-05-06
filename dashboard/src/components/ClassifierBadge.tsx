"use client";
import { motion, AnimatePresence } from "framer-motion";
import { RouteLabel, LABEL_COLORS, LABEL_DISPLAY } from "@/types/traffic";

interface Props {
  label: RouteLabel;
  confidence: number;
  reasoning: string;
}

const SIZE = 120;
const STROKE = 8;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

export function ClassifierBadge({ label, confidence, reasoning }: Props) {
  const color = LABEL_COLORS[label];
  const dash = CIRC * confidence;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="#1f2937" strokeWidth={STROKE} />
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
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs font-mono text-gray-400">{Math.round(confidence * 100)}%</span>
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="text-center"
        >
          <span className="text-sm font-bold font-mono" style={{ color }}>
            {LABEL_DISPLAY[label]}
          </span>
          <p className="text-xs text-gray-500 max-w-[200px] mt-1">{reasoning}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
