import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

type Listener = (event: string, payload: unknown) => void;

interface RealtimeContextValue {
  connected: boolean;
  subscribe: (fn: Listener) => () => void;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const listenersRef = useRef<Set<Listener>>(new Set());

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: number | null = null;
    let disposed = false;

    const connect = () => {
      if (disposed) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const url = `${protocol}//${window.location.host}/ws`;
      ws = new WebSocket(url);

      ws.onopen = () => {
        if (!disposed) setConnected(true);
      };

      ws.onmessage = (msg) => {
        try {
          const parsed = JSON.parse(msg.data as string) as { event: string; payload: unknown };
          for (const listener of listenersRef.current) {
            listener(parsed.event, parsed.payload);
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        if (!disposed) {
          setConnected(false);
          reconnectTimer = window.setTimeout(connect, 2500);
        }
      };

      ws.onerror = () => {
        ws?.close();
      };
    };

    connect();
    return () => {
      disposed = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, []);

  const subscribe = (fn: Listener) => {
    listenersRef.current.add(fn);
    return () => {
      listenersRef.current.delete(fn);
    };
  };

  return (
    <RealtimeContext.Provider value={{ connected, subscribe }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime(onEvent?: Listener): { connected: boolean } {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error('useRealtime must be used within RealtimeProvider');

  const callbackRef = useRef<Listener | undefined>(onEvent);
  callbackRef.current = onEvent;

  useEffect(() => {
    if (!callbackRef.current) return;
    return ctx.subscribe((event, payload) => {
      callbackRef.current?.(event, payload);
    });
  }, [ctx]);

  return { connected: ctx.connected };
}
