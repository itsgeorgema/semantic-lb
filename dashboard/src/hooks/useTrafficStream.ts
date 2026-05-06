"use client";
import { useEffect, useState } from "react";
import { TrafficEvent } from "@/types/traffic";

const MAX_EVENTS = 200;

export function useTrafficStream(proxyUrl: string) {
  const [events, setEvents] = useState<TrafficEvent[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const url = `${proxyUrl}/events`;
    const es = new EventSource(url);

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.connected) return;
        const ev = data as TrafficEvent;
        setEvents((prev) => [ev, ...prev].slice(0, MAX_EVENTS));
      } catch {}
    };

    return () => es.close();
  }, [proxyUrl]);

  return { events, connected };
}
