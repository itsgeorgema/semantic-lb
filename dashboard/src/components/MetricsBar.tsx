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

  const totalRps = metrics.reduce((sum, m) => sum + m.rps, 0);

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
    <div data-scroll data-scroll-class="is-inview" className="scroll-reveal panel rounded-[1.4rem] p-4 sm:p-5">

      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: "var(--text-muted)" }}>
            rolling 5s window
          </h3>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="tabular font-mono text-3xl font-semibold" style={{ color: "var(--text-primary)" }}>
              {totalRps.toFixed(1)}
            </span>
            <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>req / s</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 pt-1">
          {LABELS.map((l) => (
            <div key={l} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid var(--border)" }}>
              <span className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: LABEL_COLORS[l] }} />
              <span className="text-[11px] font-mono" style={{ color: "var(--text-secondary)" }}>
                {LABEL_DISPLAY[l]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      {history.length > 1 ? (
        <ResponsiveContainer width="100%" height={88}>
          <AreaChart data={history} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
            <XAxis dataKey="t" hide />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: "#18181b",
                border: "1px solid rgba(230,218,194,0.13)",
                borderRadius: "10px",
                fontSize: 11,
                fontFamily: "JetBrains Mono, monospace",
                padding: "8px 12px",
                color: "#b9b1a1",
              }}
              itemStyle={{ color: "#b9b1a1" }}
              formatter={(v: number, name: string) => [
                `${v.toFixed(2)} rps`,
                LABEL_DISPLAY[name as RouteLabel],
              ]}
              labelFormatter={() => ""}
            />
            {LABELS.map((l) => (
              <Area
                key={l}
                type="monotone"
                dataKey={l}
                stroke={LABEL_COLORS[l]}
                fill={LABEL_COLORS[l] + "16"}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[88px] items-center justify-center rounded-xl" style={{ background: "rgba(255,255,255,0.018)", border: "1px dashed var(--border-mid)" }}>
          <p className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
            collecting a baseline
          </p>
        </div>
      )}
    </div>
  );
}
