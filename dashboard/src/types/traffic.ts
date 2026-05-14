export type RouteLabel = "general" | "high-compute" | "fast-path";

export interface TrafficEvent {
  id: string;
  timestamp: number;
  label: RouteLabel;
  confidence: number;
  reasoning: string;
  payloadSnippet: string;
  classifyLatencyMs: number;
  totalLatencyMs: number;
  upstreamUrl: string;
  statusCode: number;
}

export interface MetricsSnapshot {
  label: RouteLabel;
  count: number;
  rps: number;
  p99Ms: number;
}

export const LABEL_COLORS: Record<RouteLabel, string> = {
  general: "#8aa6d9",
  "high-compute": "#d6a85a",
  "fast-path": "#6fbf91",
};

export const LABEL_DISPLAY: Record<RouteLabel, string> = {
  general: "General",
  "high-compute": "High Compute",
  "fast-path": "Fast Path",
};
