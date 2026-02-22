"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  AlertOverlayDisplay,
  AlertEvent,
} from "@/app/alerts/components/AlertOverlayDisplay";

export default function AlertsOverlayPage() {
  const [queue, setQueue] = useState<AlertEvent[]>([]);
  const [current, setCurrent] = useState<AlertEvent | null>(null);
  const busyRef = useRef(false);

  const processQueue = useCallback(() => {
    if (busyRef.current) return;
    setQueue((prev) => {
      if (prev.length === 0) return prev;
      const [next, ...rest] = prev;
      busyRef.current = true;
      setCurrent(next);
      return rest;
    });
  }, []);

  useEffect(() => {
    processQueue();
  }, [queue, processQueue]);

  const handleDone = useCallback(() => {
    setCurrent(null);
    busyRef.current = false;
    // Small gap between alerts
    setTimeout(() => processQueue(), 500);
  }, [processQueue]);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    const tokenQuery = token ? `?token=${token}` : "";
    const es = new EventSource(`/api/alerts/stream${tokenQuery}`);

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "connected") return;
        setQueue((prev) => [...prev, data as AlertEvent]);
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      // SSE will auto-reconnect
    };

    return () => es.close();
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "transparent",
        pointerEvents: "none",
      }}
    >
      {current && (
        <AlertOverlayDisplay
          key={current.id}
          alert={current}
          onDone={handleDone}
        />
      )}
    </div>
  );
}
