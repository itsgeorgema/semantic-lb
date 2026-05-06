"use client";
import { useTrafficStream } from "@/hooks/useTrafficStream";
import { useMetrics } from "@/hooks/useMetrics";
import { RequestFlow } from "./RequestFlow";
import { RouteCard } from "./RouteCard";
import { PayloadInspector } from "./PayloadInspector";
import { ClassifierBadge } from "./ClassifierBadge";
import { MetricsBar } from "./MetricsBar";
import { RouteLabel } from "@/types/traffic";

const PROXY_URL = process.env.NEXT_PUBLIC_PROXY_URL || "http://localhost:8080";

export function TrafficDashboard() {
  const { events, connected } = useTrafficStream(PROXY_URL);
  const metrics = useMetrics(events);
  const latest = events[0] ?? null;

  const lastReasoningByLabel = (label: RouteLabel) =>
    events.find((e) => e.label === label)?.reasoning;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 font-mono">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Semantic Load Balancer</h1>
          <p className="text-sm text-gray-500">L8 Intent-Based Routing</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-400" : "bg-red-500"}`} />
          <span className="text-xs text-gray-500">{connected ? "Live" : "Disconnected"}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Flow + Classifier */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <RequestFlow latestEvent={latest} />
          <MetricsBar metrics={metrics} />
          <PayloadInspector events={events} />
        </div>

        {/* Right: Classifier badge + Route cards */}
        <div className="flex flex-col gap-4">
          {latest && (
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 flex justify-center">
              <ClassifierBadge
                label={latest.label}
                confidence={latest.confidence}
                reasoning={latest.reasoning}
              />
            </div>
          )}
          {metrics.map((snap) => (
            <RouteCard
              key={snap.label}
              snapshot={snap}
              lastReasoning={lastReasoningByLabel(snap.label)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
