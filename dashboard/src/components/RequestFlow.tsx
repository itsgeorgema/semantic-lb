"use client";
import { useEffect, useRef } from "react";
import { motion, useAnimate } from "framer-motion";
import { TrafficEvent, RouteLabel, LABEL_COLORS, LABEL_DISPLAY } from "@/types/traffic";

interface Props {
  latestEvent: TrafficEvent | null;
}

// Packet circle rests at this SVG coordinate
const PACKET_BASE = { cx: 62, cy: 140 };

// CSS transform deltas relative to PACKET_BASE so the packet lands inside each pool
const POOL_TARGETS: Record<RouteLabel, { x: number; y: number }> = {
  general:        { x: 356, y: -73 },
  "high-compute": { x: 356, y: 0   },
  "fast-path":    { x: 356, y: 73  },
};

// Bezier paths from proxy-right (245,140) to each pool-left (400,y)
const ROUTE_PATHS: Record<RouteLabel, string> = {
  general:        "M 245 140 C 315 140 320 67 400 67",
  "high-compute": "M 245 140 L 400 140",
  "fast-path":    "M 245 140 C 315 140 320 213 400 213",
};

// Pool center positions for node rendering
const POOL_CENTERS: Record<RouteLabel, number> = {
  general:        67,
  "high-compute": 140,
  "fast-path":    213,
};

const POOL_LABELS: Record<RouteLabel, string> = {
  general:        "GENERAL",
  "high-compute": "HIGH COMPUTE",
  "fast-path":    "FAST PATH",
};

export function RequestFlow({ latestEvent }: Props) {
  const [scope, animate] = useAnimate();
  const prevId = useRef<string | null>(null);

  const label = latestEvent?.label ?? "general";
  const color = LABEL_COLORS[label];

  useEffect(() => {
    if (!latestEvent || latestEvent.id === prevId.current) return;
    prevId.current = latestEvent.id;

    const target = POOL_TARGETS[latestEvent.label];
    const packetColor = LABEL_COLORS[latestEvent.label];

    animate("#rf-packet-fill", { fill: packetColor }, { duration: 0 });
    animate([
      ["#rf-packet", { opacity: 1, x: 0, y: 0 }, { duration: 0 }],
      ["#rf-packet", { x: 143, y: 0 }, { duration: 0.32, ease: [0.4, 0, 0.2, 1] }],
      ["#rf-packet", { x: target.x, y: target.y }, { duration: 0.42, ease: [0.4, 0, 0.2, 1] }],
      ["#rf-packet", { opacity: 0 }, { duration: 0.18 }],
    ]);
  }, [latestEvent, animate]);

  return (
    <div data-scroll data-scroll-class="is-inview" className="scroll-reveal panel rounded-[1.4rem] p-4 sm:p-5">

      {/* Header row */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: "var(--text-muted)" }}>
            live route trace
          </h3>
          <p className="mt-1 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
            Client traffic enters the proxy, the model classifies intent, and the packet lands in the chosen pool.
          </p>
        </div>
        {latestEvent && (
          <motion.div
            key={latestEvent.label}
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-[11px]"
            style={{
              background: `${color}15`,
              border: `1px solid ${color}30`,
              color,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color }} />
            {LABEL_DISPLAY[latestEvent.label]}
          </motion.div>
        )}
      </div>

      {/* Flow SVG */}
      <div className="overflow-x-auto pb-1">
      <svg ref={scope} className="w-full" width="100%" viewBox="0 0 560 265" style={{ overflow: "visible" }}>
        <defs>
          <filter id="rf-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Subtle grid ── */}
        {[67, 140, 213].map((y) => (
          <line key={y} x1="0" y1={y} x2="560" y2={y}
                stroke="#282d28" strokeWidth="1" strokeDasharray="3 9" />
        ))}

        {/* ── Ingress → Proxy connector ── */}
        <line x1={105} y1={140} x2={165} y2={140} stroke="#323832" strokeWidth="1.5" />

        {/* ── Classifier annotation dashed line ── */}
        <line x1={205} y1={97} x2={205} y2={115}
              stroke="#d6a85a" strokeWidth="1" strokeDasharray="2 3" strokeOpacity="0.55" />

        {/* ── Route paths ── */}
        {(["general", "high-compute", "fast-path"] as RouteLabel[]).map((l) => {
          const isActive = latestEvent?.label === l;
          const pc = LABEL_COLORS[l];
          return (
            <path
              key={`path-${l}`}
              d={ROUTE_PATHS[l]}
              fill="none"
              className={isActive ? "flow-current" : undefined}
              stroke={isActive ? pc : "#2b302b"}
              strokeWidth={isActive ? 1.5 : 1}
              strokeOpacity={isActive ? 0.55 : 1}
              style={{ transition: "stroke 0.45s, stroke-width 0.45s, stroke-opacity 0.45s" }}
            />
          );
        })}

        {/* ── INGRESS node ── */}
        <rect x={20} y={116} width={85} height={48} rx={8}
              fill="#121612" stroke="#323832" strokeWidth="1.5" />
        <text x={62} y={135} textAnchor="middle" fill="#5d564c" fontSize={7.5}
              fontFamily="JetBrains Mono, monospace" letterSpacing="1.5">CLIENT</text>
        <text x={62} y={152} textAnchor="middle" fill="#b9b1a1" fontSize={11}
              fontFamily="JetBrains Mono, monospace">ingress</text>

        {/* ── CLASSIFIER node (pill, above proxy) ── */}
        <rect x={165} y={62} width={80} height={34} rx={17}
              fill="#241d11" stroke="#d6a85a" strokeWidth="1" strokeOpacity="0.62" />
        <text x={205} y={75} textAnchor="middle" fill="#d6a85a" fontSize={7}
              fontFamily="JetBrains Mono, monospace" letterSpacing="2">AI MODEL</text>
        <text x={205} y={89} textAnchor="middle" fill="#f0c878" fontSize={9.5}
              fontFamily="JetBrains Mono, monospace">classifier</text>

        {/* ── PROXY / ROUTER node ── */}
        <rect x={165} y={115} width={80} height={50} rx={8}
              fill="#121612" stroke="#323832" strokeWidth="1.5" />
        <text x={205} y={134} textAnchor="middle" fill="#5d564c" fontSize={7.5}
              fontFamily="JetBrains Mono, monospace" letterSpacing="1.5">PROXY</text>
        <text x={205} y={152} textAnchor="middle" fill="#b9b1a1" fontSize={11}
              fontFamily="JetBrains Mono, monospace">router</text>

        {/* ── POOL nodes ── */}
        {(["general", "high-compute", "fast-path"] as RouteLabel[]).map((l) => {
          const cy = POOL_CENTERS[l];
          const pc = LABEL_COLORS[l];
          const isActive = latestEvent?.label === l;
          return (
            <g key={`pool-${l}`}>
              <rect
                x={400} y={cy - 22} width={148} height={44} rx={8}
                fill={isActive ? `${pc}14` : "#121612"}
                stroke={isActive ? pc : "#2b302b"}
                strokeWidth={isActive ? 1.5 : 1}
                style={{ transition: "fill 0.45s, stroke 0.45s, stroke-width 0.45s" }}
              />
              {/* Left accent stripe */}
              {isActive && (
                <rect x={400} y={cy - 22} width={3} height={44} rx={1.5} fill={pc} />
              )}
              {/* Pool label */}
              <text x={475} y={cy - 5} textAnchor="middle"
                    fill={isActive ? pc : "#5d564c"}
                    fontSize={7.5} fontFamily="JetBrains Mono, monospace" letterSpacing="1.2"
                    style={{ transition: "fill 0.45s" }}>
                {POOL_LABELS[l]}
              </text>
              <text x={475} y={cy + 10} textAnchor="middle"
                    fill={isActive ? "#f3efe6" : "#5d564c"}
                    fontSize={10} fontFamily="JetBrains Mono, monospace"
                    style={{ transition: "fill 0.45s" }}>
                {LABEL_DISPLAY[l]}
              </text>
            </g>
          );
        })}

        {/* ── Animated request packet ── */}
        <g id="rf-packet" style={{ opacity: 0 }}>
          <circle cx={PACKET_BASE.cx} cy={PACKET_BASE.cy} r={9}
                  fill="transparent" filter="url(#rf-glow)" />
          <circle id="rf-packet-fill" cx={PACKET_BASE.cx} cy={PACKET_BASE.cy} r={4.5}
                  fill={color} filter="url(#rf-glow)" />
        </g>

        {/* ── Reasoning snippet ── */}
        {latestEvent && (
          <text x={0} y={257} fontSize={9.5} fontFamily="JetBrains Mono, monospace">
            <tspan fill={color}>{">"} </tspan>
            <tspan fill="#81796b">
              {latestEvent.reasoning.slice(0, 78)}
              {latestEvent.reasoning.length > 78 ? "…" : ""}
            </tspan>
          </text>
        )}
      </svg>
      </div>
    </div>
  );
}
