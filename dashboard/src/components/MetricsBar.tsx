"use client";
import { useEffect, useRef, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { MetricsSnapshot, RouteLabel, LABEL_COLORS, LABEL_DISPLAY } from "@/types/traffic";

interface Props {
  metrics: MetricsSnapshot[];
}

interface DataPoint {
  t: number;
  general: number;
  "high-compute": number;
  "fast-path": number;
}

const LABELS: RouteLabel[] = ["general", "high-compute", "fast-path"];

export function MetricsBar({ metrics }: Props) {
  const [history, setHistory] = useState<DataPoint[]>([]);
  const tickRef = useRef(0);

  useEffect(() => {
    tickRef.current += 1;
    const point: DataPoint = {
      t: tickRef.current,
      general: metrics.find((m) => m.label === "general")?.rps ?? 0,
      "high-compute": metrics.find((m) => m.label === "high-compute")?.rps ?? 0,
      "fast-path": metrics.find((m) => m.label === "fast-path")?.rps ?? 0,
    };
    setHistory((prev) => [...prev, point].slice(-60));
  }, [metrics]);

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <h3 className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-3">Requests / Second</h3>
      <ResponsiveContainer width="100%" height={100}>
        <AreaChart data={history}>
          <XAxis dataKey="t" hide />
          <YAxis hide />
          <Tooltip
            contentStyle={{ background: "#111827", border: "1px solid #374151", fontSize: 11 }}
            formatter={(v: number, name: string) => [`${v.toFixed(2)} rps`, LABEL_DISPLAY[name as RouteLabel]]}
            labelFormatter={() => ""}
          />
          {LABELS.map((label) => (
            <Area
              key={label}
              type="monotone"
              dataKey={label}
              stroke={LABEL_COLORS[label]}
              fill={LABEL_COLORS[label] + "22"}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
