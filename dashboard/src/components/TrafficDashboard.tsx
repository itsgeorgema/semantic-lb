"use client";
import type { ReactNode } from "react";
import { motion, type Variants, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BracketsCurly,
  ChartLineUp,
  Gauge,
  GitBranch,
  PlugsConnected,
  Pulse,
  TerminalWindow,
} from "@phosphor-icons/react";
import { useTrafficStream } from "@/hooks/useTrafficStream";
import { useMetrics } from "@/hooks/useMetrics";
import { RequestFlow } from "./RequestFlow";
import { RouteCard } from "./RouteCard";
import { PayloadInspector } from "./PayloadInspector";
import { ClassifierBadge } from "./ClassifierBadge";
import { DesktopSmoothScroll } from "./DesktopSmoothScroll";
import { MetricsBar } from "./MetricsBar";
import { RouteLabel } from "@/types/traffic";

const PROXY_URL = process.env.NEXT_PUBLIC_PROXY_URL || "http://localhost:8080";

const spring = { type: "spring", stiffness: 110, damping: 24, mass: 0.9 };

const pageSequence: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.08,
    },
  },
};

const riseIn: Variants = {
  hidden: { opacity: 0, y: 18, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: spring },
};

const softScale: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: spring },
};

export function TrafficDashboard() {
  const reduceMotion = useReducedMotion();
  const { events, connected } = useTrafficStream(PROXY_URL);
  const metrics = useMetrics(events);
  const latest = events[0] ?? null;
  const totalRequests = events.length;
  const totalRps = metrics.reduce((sum, m) => sum + m.rps, 0);
  const activePool = latest ? latest.label : null;

  const lastReasoningByLabel = (label: RouteLabel) =>
    events.find((e) => e.label === label)?.reasoning;

  return (
    <div className="min-h-[100dvh] font-sans" style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}>
      <DesktopSmoothScroll />
      <motion.header
        initial={reduceMotion ? false : { opacity: 0, y: -16 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="sticky top-0 z-20 border-b backdrop-blur-xl"
        style={{ borderColor: "var(--border)", background: "rgba(13, 15, 14, 0.78)" }}
      >
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="#overview" data-scroll-to data-scroll-to-offset="-88" className="focus-ring interactive flex items-center gap-3 rounded-xl" aria-label="Semantic LB overview">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "var(--accent-dim)", border: "1px solid rgba(214,168,90,0.28)" }}>
              <GitBranch className="motion-orbit" size={18} weight="duotone" color="var(--accent-strong)" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tracking-tight">Semantic LB</span>
                <span className="rounded-md px-1.5 py-0.5 font-mono text-[10px]" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                  L8
                </span>
              </div>
              <p className="hidden text-[11px] sm:block" style={{ color: "var(--text-faint)" }}>intent routing console</p>
            </div>
          </a>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Dashboard sections">
            {[
              ["#flow", "Flow"],
              ["#metrics", "Metrics"],
              ["#logs", "Logs"],
            ].map(([href, label]) => (
              <a key={href} href={href} data-scroll-to data-scroll-to-offset="-88" className="focus-ring interactive rounded-lg px-3 py-2 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 rounded-full px-3 py-1.5 font-mono text-xs"
               style={{
                 background: connected ? "rgba(111,191,145,0.10)" : "rgba(224,122,111,0.10)",
                 border: `1px solid ${connected ? "rgba(111,191,145,0.24)" : "rgba(224,122,111,0.24)"}`,
                 color: connected ? "var(--success)" : "var(--danger)",
               }}>
            <span className={`h-1.5 w-1.5 rounded-full ${connected ? "status-breathe" : ""}`}
                  style={{ background: connected ? "var(--success)" : "var(--danger)" }} />
            {connected ? "stream live" : "stream offline"}
          </div>
        </div>
      </motion.header>

      <motion.main
        variants={reduceMotion ? undefined : pageSequence}
        initial={reduceMotion ? false : "hidden"}
        animate={reduceMotion ? undefined : "show"}
        className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
      >
        <motion.section id="overview" variants={reduceMotion ? undefined : pageSequence} className="grid min-w-0 gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          <motion.div variants={reduceMotion ? undefined : softScale} className="panel min-w-0 overflow-hidden rounded-[1.6rem] p-6 sm:p-8">
            <motion.div variants={reduceMotion ? undefined : pageSequence} className="mb-8 flex flex-wrap items-center gap-2">
              <motion.span variants={reduceMotion ? undefined : riseIn} className="rounded-lg px-2.5 py-1 font-mono text-[11px]" style={{ background: "var(--accent-dim)", color: "var(--accent-strong)", border: "1px solid rgba(214,168,90,0.25)" }}>
                live classifier
              </motion.span>
              <motion.span variants={reduceMotion ? undefined : riseIn} className="rounded-lg px-2.5 py-1 font-mono text-[11px]" style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                proxy {PROXY_URL.replace(/^https?:\/\//, "")}
              </motion.span>
            </motion.div>

            <div className="grid gap-8 xl:grid-cols-[1fr_21rem]">
              <motion.div variants={reduceMotion ? undefined : riseIn}>
                <motion.h1
                  initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                  animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={{ ...spring, delay: 0.18 }}
                  className="max-w-3xl text-balance text-4xl font-semibold leading-[0.96] tracking-tight sm:text-5xl lg:text-6xl"
                >
                  Load balancer simulator
                </motion.h1>
                <motion.p variants={reduceMotion ? undefined : riseIn} className="mt-5 max-w-[62ch] text-base leading-7" style={{ color: "var(--text-secondary)" }}>
                  Simulate proxy payload intent classification and backend pool routing with reasoning and throughput logging.
                </motion.p>
              </motion.div>

              <motion.div variants={reduceMotion ? undefined : pageSequence} className="grid grid-cols-2 gap-3">
                <SummaryTile icon={<Pulse size={18} weight="duotone" />} label="throughput" value={totalRps.toFixed(1)} suffix="r/s" />
                <SummaryTile icon={<TerminalWindow size={18} weight="duotone" />} label="captured" value={String(totalRequests)} suffix="req" />
                <SummaryTile icon={<Gauge size={18} weight="duotone" />} label="active pool" value={activePool ? activePool.replace("-", " ") : "waiting"} wide />
              </motion.div>
            </div>
          </motion.div>

          <motion.aside variants={reduceMotion ? undefined : softScale} className="panel min-w-0 rounded-[1.6rem] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: "var(--text-faint)" }}>Start here</p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight">Generate traffic, then inspect the route.</h2>
              </div>
              <BracketsCurly size={24} weight="duotone" color="var(--accent-strong)" />
            </div>
            <motion.div variants={reduceMotion ? undefined : pageSequence} className="mt-5 space-y-3">
              <StepLine index="01" title="Send a request" detail={`POST ${PROXY_URL}/v1/chat/completions`} />
              <StepLine index="02" title="Follow the packet" detail="The flow diagram highlights the selected pool." />
              <StepLine index="03" title="Read the decision" detail="Use confidence, reasoning, and logs to validate classification." />
            </motion.div>
            <motion.a href="#logs" data-scroll-to data-scroll-to-offset="-88" whileHover={reduceMotion ? undefined : { y: -2 }} whileTap={reduceMotion ? undefined : { scale: 0.985 }} className="focus-ring interactive mt-6 inline-flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold" style={{ background: "var(--accent)", color: "#17130b" }}>
              inspect latest requests
              <ArrowRight size={16} weight="bold" />
            </motion.a>
          </motion.aside>
        </motion.section>

        <motion.section variants={reduceMotion ? undefined : pageSequence} className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <motion.div variants={reduceMotion ? undefined : pageSequence} className="flex min-w-0 flex-col gap-6">
            <SectionHeading id="flow" icon={<GitBranch size={18} weight="duotone" />} label="Routing map" title="Classifier path" detail="The animated packet shows the latest route chosen by the model." />
            <motion.div variants={reduceMotion ? undefined : softScale}><RequestFlow latestEvent={latest} /></motion.div>

            <SectionHeading id="metrics" icon={<ChartLineUp size={18} weight="duotone" />} label="Load shape" title="Throughput" detail="RPS history by pool, with stable numeric readouts for quick scanning." />
            <motion.div variants={reduceMotion ? undefined : softScale}><MetricsBar metrics={metrics} /></motion.div>

            <SectionHeading id="logs" icon={<TerminalWindow size={18} weight="duotone" />} label="Request evidence" title="Payload log" detail="Filter recent payloads by route and compare classification latency against total latency." />
            <motion.div variants={reduceMotion ? undefined : softScale}><PayloadInspector events={events} /></motion.div>
          </motion.div>

          <motion.aside variants={reduceMotion ? undefined : pageSequence} className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
            <motion.div variants={reduceMotion ? undefined : softScale}>
              <SectionKicker icon={<PlugsConnected size={16} weight="duotone" />} label="Current decision" />
              {latest ? (
                <motion.div layout className="panel rounded-[1.4rem] p-6">
                  <ClassifierBadge
                    label={latest.label}
                    confidence={latest.confidence}
                    reasoning={latest.reasoning}
                  />
                </motion.div>
              ) : (
                <motion.div layout className="panel rounded-[1.4rem] p-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl"
                       style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
                    <Pulse className="status-breathe" size={22} weight="duotone" color="var(--text-muted)" />
                  </div>
                  <p className="mt-4 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                    Awaiting traffic
                  </p>
                  <p className="mx-auto mt-2 max-w-[24ch] text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    Send a request through the proxy and the decision ring will populate here.
                  </p>
                </motion.div>
              )}
            </motion.div>

            <motion.div variants={reduceMotion ? undefined : softScale}>
              <SectionKicker icon={<GitBranch size={16} weight="duotone" />} label="Backend pools" />
              <div className="flex flex-col gap-3">
                {metrics.map((snap) => (
                  <RouteCard
                    key={snap.label}
                    snapshot={snap}
                    lastReasoning={lastReasoningByLabel(snap.label)}
                    isActive={latest?.label === snap.label}
                  />
                ))}
              </div>
            </motion.div>
          </motion.aside>
        </motion.section>
      </motion.main>
    </div>
  );
}

function SummaryTile({
  icon,
  label,
  value,
  suffix,
  wide,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  suffix?: string;
  wide?: boolean;
}) {
  return (
    <motion.div layout variants={softScale} className={`rounded-2xl p-4 ${wide ? "col-span-2" : ""}`} style={{ background: "rgba(255,255,255,0.035)", border: "1px solid var(--border)" }}>
      <div className="mb-4 flex items-center justify-between" style={{ color: "var(--text-muted)" }}>
        {icon}
        <span className="font-mono text-[10px] uppercase tracking-[0.18em]">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <motion.span
          key={value}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 24 }}
          className="tabular font-mono text-2xl font-semibold leading-none"
        >
          {value}
        </motion.span>
        {suffix && <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>{suffix}</span>}
      </div>
    </motion.div>
  );
}

function StepLine({ index, title, detail }: { index: string; title: string; detail: string }) {
  return (
    <motion.div variants={riseIn} className="grid grid-cols-[2.5rem_1fr] gap-3 rounded-xl p-3" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid var(--border)" }}>
      <span className="font-mono text-xs" style={{ color: "var(--accent-strong)" }}>{index}</span>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 font-mono text-[11px] leading-5" style={{ color: "var(--text-muted)" }}>{detail}</p>
      </div>
    </motion.div>
  );
}

function SectionHeading({ id, icon, label, title, detail }: { id: string; icon: ReactNode; label: string; title: string; detail: string }) {
  return (
    <motion.div id={id} variants={softScale} className="scroll-mt-24 pt-2">
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: "var(--accent-strong)" }}>
            {icon}
            {label}
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-1 max-w-[64ch] text-sm leading-6" style={{ color: "var(--text-muted)" }}>{detail}</p>
        </div>
      </div>
    </motion.div>
  );
}

function SectionKicker({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: "var(--text-faint)" }}>
      {icon}
      {label}
    </div>
  );
}
