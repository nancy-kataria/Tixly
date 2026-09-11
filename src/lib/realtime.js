import { createClient } from "@/lib/supabase/client";

const shared = new Map(); // topic -> { supabase, channel, listeners, status, closeTimer }
const CLOSE_DELAY_MS = 2000;

// Shares one Realtime channel per topic between components.
//
// React can mount, unmount and remount a component in quick succession
// (Strict Mode always does in development), and supabase-js hands back the
// existing channel object for a topic until it has finished closing, so a
// fresh subscribe() on it never connects. Sharing the channel, and closing
// it only after a moment with no listeners, avoids that.
//
// bind(channel, dispatch): attach .on(...) handlers that call dispatch(payload).
// Returns an unsubscribe function, suitable as a useEffect cleanup.
export function subscribeToTopic(topic, bind, { onMessage, onStatus }) {
  let entry = shared.get(topic);

  if (!entry) {
    const supabase = createClient();
    const channel = supabase.channel(topic);
    const listeners = new Set();
    entry = { supabase, channel, listeners, status: "CONNECTING", closeTimer: null };
    const current = entry;

    bind(channel, (payload) => listeners.forEach((listener) => listener.onMessage?.(payload)));
    channel.subscribe((status) => {
      current.status = status;
      listeners.forEach((listener) => listener.onStatus?.(status));
    });
    shared.set(topic, entry);
  }

  clearTimeout(entry.closeTimer);
  const listener = { onMessage, onStatus };
  entry.listeners.add(listener);

  // A listener joining an already-open channel still hears its status.
  const joined = entry;
  queueMicrotask(() => {
    if (joined.listeners.has(listener)) listener.onStatus?.(joined.status);
  });

  return () => {
    joined.listeners.delete(listener);
    if (joined.listeners.size > 0) return;
    joined.closeTimer = setTimeout(() => {
      shared.delete(topic);
      joined.supabase.removeChannel(joined.channel);
    }, CLOSE_DELAY_MS);
  };
}
