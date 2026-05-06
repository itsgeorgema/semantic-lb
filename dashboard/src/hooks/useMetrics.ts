"use client";
import { useMemo } from "react";
import { MetricsSnapshot, RouteLabel, TrafficEvent } from "@/types/traffic";

const LABELS: RouteLabel[] = ["general", "high-compute", "fast-path"];
const RPS_WINDOW_MS = 5000;

export function useMetrics(events: TrafficEvent[]): MetricsSnapshot[] {
  return useMemo(() => {
    const now = Date.now();
    return LABELS.map((label) => {
      const all = events.filter((e) => e.label === label);
      const recent = all.filter((e) => now - e.timestamp < RPS_WINDOW_MS);
      const latencies = all.map((e) => e.totalLatencyMs).sort((a, b) => a - b);
      const p99 = latencies[Math.floor(latencies.length * 0.99)] ?? 0;
      return {
        label,
        count: all.length,
        rps: recent.length / (RPS_WINDOW_MS / 1000),
        p99Ms: Math.round(p99),
      };
    });
  }, [events]);
}
