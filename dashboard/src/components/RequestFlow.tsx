"use client";
import { useEffect, useRef } from "react";
import { motion, useAnimate } from "framer-motion";
import { TrafficEvent, RouteLabel, LABEL_COLORS, LABEL_DISPLAY } from "@/types/traffic";

interface Props {
  latestEvent: TrafficEvent | null;
}

const POOL_Y: Record<RouteLabel, number> = {
  general: 60,
  "high-compute": 140,
  "fast-path": 220,
};

export function RequestFlow({ latestEvent }: Props) {
  const [scope, animate] = useAnimate();
  const prevId = useRef<string | null>(null);

  useEffect(() => {
    if (!latestEvent || latestEvent.id === prevId.current) return;
    prevId.current = latestEvent.id;

    const color = LABEL_COLORS[latestEvent.label];
    const targetY = POOL_Y[latestEvent.label];

    animate([
      ["#packet", { opacity: 1, x: 40, y: 140 }, { duration: 0 }],
      ["#packet", { x: 200 }, { duration: 0.3, ease: "easeIn" }],
      ["#packet", { x: 360, y: targetY }, { duration: 0.4, ease: "easeOut" }],
      ["#packet", { opacity: 0 }, { duration: 0.2 }],
    ]);
    animate("#packet-fill", { fill: color }, { duration: 0 });
  }, [latestEvent, animate]);

  const label = latestEvent?.label ?? "general";
  const color = LABEL_COLORS[label];

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <h3 className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-3">Traffic Flow</h3>
      <svg ref={scope} width="100%" viewBox="0 0 480 280" className="overflow-visible">
        {/* Ingress node */}
        <rect x={10} y={120} width={90} height={40} rx={6} fill="#1f2937" stroke="#374151" />
        <text x={55} y={143} textAnchor="middle" fill="#9ca3af" fontSize={10} fontFamily="monospace">Ingress</text>

        {/* Proxy node */}
        <rect x={170} y={120} width={90} height={40} rx={6} fill="#1f2937" stroke="#374151" />
        <text x={215} y={143} textAnchor="middle" fill="#9ca3af" fontSize={10} fontFamily="monospace">Proxy</text>

        {/* Classifier annotation */}
        <rect x={185} y={90} width={60} height={20} rx={4} fill="#312e81" />
        <text x={215} y={103} textAnchor="middle" fill="#a5b4fc" fontSize={8} fontFamily="monospace">Classifier</text>
        <line x1={215} y1={110} x2={215} y2={120} stroke="#4f46e5" strokeDasharray="2 2" />

        {/* Lines ingress→proxy */}
        <line x1={100} y1={140} x2={170} y2={140} stroke="#374151" />

        {/* Pool nodes */}
        {(["general", "high-compute", "fast-path"] as RouteLabel[]).map((l) => (
          <g key={l}>
            <line x1={260} y1={140} x2={360} y2={POOL_Y[l] + 20} stroke="#1f2937" />
            <rect x={360} y={POOL_Y[l]} width={110} height={40} rx={6}
              fill={label === l ? LABEL_COLORS[l] + "33" : "#1f2937"}
              stroke={label === l ? LABEL_COLORS[l] : "#374151"}
            />
            <text x={415} y={POOL_Y[l] + 23} textAnchor="middle" fill={LABEL_COLORS[l]} fontSize={9} fontFamily="monospace">
              {LABEL_DISPLAY[l]}
            </text>
          </g>
        ))}

        {/* Animated packet */}
        <circle id="packet" cx={40} cy={140} r={6} opacity={0}>
          <title>Request packet</title>
        </circle>
        <circle id="packet-fill" cx={40} cy={140} r={6} fill={color} opacity={0} />

        {/* Live label */}
        {latestEvent && (
          <text x={215} y={200} textAnchor="middle" fill={color} fontSize={9} fontFamily="monospace">
            {latestEvent.reasoning.slice(0, 50)}
          </text>
        )}
      </svg>
    </div>
  );
}
