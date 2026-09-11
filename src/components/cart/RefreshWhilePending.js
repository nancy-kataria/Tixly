"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";

const INTERVAL_MS = 2000;
const MAX_ATTEMPTS = 30; // about a minute

// Re-fetches the order page every 2 seconds until Stripe's webhook has
// confirmed the payment (the page then stops rendering this component).
export default function RefreshWhilePending() {
  const router = useRouter();
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts += 1;
      if (attempts > MAX_ATTEMPTS) {
        clearInterval(interval);
        setGaveUp(true);
        return;
      }
      router.refresh();
    }, INTERVAL_MS);
    return () => clearInterval(interval);
  }, [router]);

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
