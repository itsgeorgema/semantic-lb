"use client";
import { motion } from "framer-motion";
import { MetricsSnapshot, LABEL_COLORS, LABEL_DISPLAY } from "@/types/traffic";

interface Props {
  snapshot: MetricsSnapshot;
  lastReasoning?: string;
}

export function RouteCard({ snapshot, lastReasoning }: Props) {
  const color = LABEL_COLORS[snapshot.label];
  return (
    <motion.div
      layout
      className="rounded-xl border border-gray-800 bg-gray-900 p-4 flex flex-col gap-2"
      style={{ borderLeftColor: color, borderLeftWidth: 3 }}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm font-semibold" style={{ color }}>
          {LABEL_DISPLAY[snapshot.label]}
        </span>
        <motion.span
          key={snapshot.count}
          initial={{ scale: 1.4 }}
          animate={{ scale: 1 }}
          className="text-xs font-mono text-gray-300"
        >
          {snapshot.count} req
        </motion.span>
      </div>
      <div className="flex gap-4 text-xs font-mono text-gray-400">
        <span>{snapshot.rps.toFixed(1)} rps</span>
        <span>p99: {snapshot.p99Ms}ms</span>
      </div>
      {lastReasoning && (
        <p className="text-xs text-gray-600 truncate">{lastReasoning}</p>
      )}
    </motion.div>
  );
}
