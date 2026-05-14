"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FunnelSimple, ListMagnifyingGlass } from "@phosphor-icons/react";
import { TrafficEvent, LABEL_COLORS, LABEL_DISPLAY, RouteLabel } from "@/types/traffic";

interface Props {
  events: TrafficEvent[];
}

const FILTERS: Array<RouteLabel | "all"> = ["all", "general", "high-compute", "fast-path"];

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function highlight(json: string): string {
  const safe = escapeHtml(json);
  return safe
    .replace(/(&quot;[\w\s]+&quot;)\s*:/g, '<span style="color:#d6a85a">$1</span>:')
    .replace(/:\s*(&quot;.*?&quot;)/g, ': <span style="color:#6fbf91">$1</span>')
    .replace(/:\s*(\d+\.?\d*)/g, ': <span style="color:#e07a6f">$1</span>');
}

export function PayloadInspector({ events }: Props) {
  const [filter, setFilter] = useState<RouteLabel | "all">("all");
  const filtered = filter === "all" ? events : events.filter((event) => event.label === filter);
  const shown = filtered.slice(0, 7);

  return (
    <div data-scroll data-scroll-class="is-inview" className="scroll-reveal panel overflow-hidden rounded-[1.4rem]">
      <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
           style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "rgba(255,255,255,0.035)", border: "1px solid var(--border)" }}>
            <ListMagnifyingGlass size={18} weight="duotone" color="var(--accent-strong)" />
          </div>
          <div>
            <h3 className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: "var(--text-muted)" }}>
              request log
            </h3>
            <p className="mt-0.5 text-xs" style={{ color: "var(--text-faint)" }}>
              latest payloads and classifier timings
            </p>
          </div>
        </div>

        <span className="tabular rounded-lg px-2.5 py-1 font-mono text-[11px]"
              style={{
                background: "rgba(255,255,255,0.035)",
                color: "var(--text-muted)",
                border: "1px solid var(--border)",
              }}>
          {filtered.length === 0
            ? "0 events"
            : `${Math.min(filtered.length, 7)} of ${filtered.length}`}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-4 py-3 sm:px-5" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="mr-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: "var(--text-faint)" }}>
          <FunnelSimple size={14} weight="duotone" />
          filter
        </div>
        {FILTERS.map((item) => {
          const active = filter === item;
          const color = item === "all" ? "#f0c878" : LABEL_COLORS[item];
          const label = item === "all" ? "All routes" : LABEL_DISPLAY[item];
          return (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className="focus-ring interactive rounded-lg px-2.5 py-1 font-mono text-[11px]"
              style={{
                background: active ? `${color}18` : "rgba(255,255,255,0.02)",
                border: `1px solid ${active ? `${color}44` : "var(--border)"}`,
                color: active ? color : "var(--text-muted)",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="max-h-[28rem] overflow-y-auto">
        <AnimatePresence initial={false}>
          {shown.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl"
                   style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
                <ListMagnifyingGlass size={20} weight="duotone" color="var(--text-muted)" />
              </div>
              <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                {events.length === 0 ? "No requests captured yet" : "No requests match this filter"}
              </p>
              <p className="max-w-[32ch] text-xs leading-5" style={{ color: "var(--text-muted)" }}>
                {events.length === 0 ? "Send traffic through the proxy to populate the timeline." : "Pick another route filter to inspect recent payloads."}
              </p>
            </motion.div>
          ) : (
            shown.map((ev, i) => (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                transition={{ duration: 0.18, delay: i * 0.025 }}
                className="px-4 py-4 sm:px-5"
                style={{
                  borderBottom: i < shown.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <div className="mb-2 flex flex-wrap items-center gap-2.5">
                  <span
                    className="flex-shrink-0 rounded-md px-2 py-0.5 font-mono text-[11px]"
                    style={{
                      background: LABEL_COLORS[ev.label] + "16",
                      color: LABEL_COLORS[ev.label],
                      border: `1px solid ${LABEL_COLORS[ev.label]}28`,
                    }}
                  >
                    {LABEL_DISPLAY[ev.label]}
                  </span>
                  <span className="tabular font-mono text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {ev.classifyLatencyMs.toFixed(0)}ms classify
                  </span>
                  <span className="tabular font-mono text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {ev.totalLatencyMs.toFixed(0)}ms total
                  </span>
                  <span className="ml-auto rounded-md px-2 py-0.5 font-mono text-[11px]"
                        style={{
                          color: ev.statusCode < 400 ? "var(--success)" : "var(--danger)",
                          background: ev.statusCode < 400 ? "rgba(111,191,145,0.08)" : "rgba(224,122,111,0.08)",
                          border: `1px solid ${ev.statusCode < 400 ? "rgba(111,191,145,0.18)" : "rgba(224,122,111,0.18)"}`,
                        }}>
                    {ev.statusCode}
                  </span>
                </div>

                <pre
                  className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed"
                  style={{ color: "var(--text-muted)" }}
                  dangerouslySetInnerHTML={{ __html: highlight(ev.payloadSnippet) }}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
