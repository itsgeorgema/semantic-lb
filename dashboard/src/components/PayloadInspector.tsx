"use client";
import { motion, AnimatePresence } from "framer-motion";
import { TrafficEvent, LABEL_COLORS } from "@/types/traffic";

interface Props {
  events: TrafficEvent[];
}

function highlight(json: string): string {
  return json
    .replace(/("[\w\s]+")\s*:/g, '<span style="color:#7dd3fc">$1</span>:')
    .replace(/:\s*(".*?")/g, ': <span style="color:#86efac">$1</span>')
    .replace(/:\s*(\d+\.?\d*)/g, ': <span style="color:#fca5a5">$1</span>');
}

export function PayloadInspector({ events }: Props) {
  return (
    <div className="flex flex-col gap-2 overflow-y-auto max-h-64">
      <h3 className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-1">Recent Payloads</h3>
      <AnimatePresence initial={false}>
        {events.slice(0, 5).map((ev) => (
          <motion.div
            key={ev.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="rounded-lg bg-gray-950 border border-gray-800 p-3"
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-xs font-mono px-1.5 py-0.5 rounded"
                style={{
                  background: LABEL_COLORS[ev.label] + "22",
                  color: LABEL_COLORS[ev.label],
                }}
              >
                {ev.label}
              </span>
              <span className="text-xs text-gray-600">{ev.classifyLatencyMs.toFixed(0)}ms classify</span>
            </div>
            <pre
              className="text-xs font-mono text-gray-400 overflow-x-auto whitespace-pre-wrap break-all"
              dangerouslySetInnerHTML={{ __html: highlight(ev.payloadSnippet) }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
