"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { subscribeToTopic } from "@/lib/realtime";

const FALLBACK_INTERVAL_MS = 5000;
const MAX_FALLBACK_ATTEMPTS = 12; // about a minute

// Waits for Stripe's webhook to confirm the payment. The order's row change
// arrives over a WebSocket (Supabase Realtime), and a slow refresh loop
// backs it up in case the connection can't be made.
export default function RefreshWhilePending({ orderId }) {
  const router = useRouter();
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToTopic(
      `order:${orderId}`,
      (channel, dispatch) =>
        channel.on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
          dispatch
        ),
      { onMessage: () => router.refresh() }
    );

    let attempts = 0;
    const interval = setInterval(() => {
      attempts += 1;
      if (attempts > MAX_FALLBACK_ATTEMPTS) {
        clearInterval(interval);
        setGaveUp(true);
        return;
      }
      router.refresh();
    }, FALLBACK_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [orderId, router]);

  if (gaveUp) {
    return (
      <p className="text-sm text-muted-foreground">
        This is taking longer than usual. Refresh the page in a minute. If you were charged, your tickets will appear in
        My tickets.
      </p>
    );
  }

  return (
    <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
      <LoaderCircle className="size-4 animate-spin" aria-hidden /> Waiting for Stripe to confirm…
    </p>
  );
}
