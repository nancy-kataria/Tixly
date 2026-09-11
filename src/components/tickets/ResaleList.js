"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { formatPrice, ticketLabel } from "@/lib/format";

// Tickets fans have listed for resale on one event, cheapest first.
// listings: [{ id, number, price_cents, list_price_cents, owner_id, section: { name } }]
export default function ResaleList({ listings, userId }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState(null);
  const [error, setError] = useState("");

  const runAction = async (ticketId, fn) => {
    if (!userId) {
      router.push("/login");
      return;
    }
    setPendingId(ticketId);
    setError("");
    const { error } = await createClient().rpc(fn, { p_ticket_id: ticketId });
    setPendingId(null);
    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
  };

  if (listings.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No resale tickets right now. Fans who can&apos;t make it can list theirs here.
      </p>
    );
  }

  return (
    <div>
      {error && (
        <p role="alert" className="mb-4 rounded-panel bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <ul className="divide-y divide-border overflow-hidden rounded-panel border border-surface-border bg-surface-strong">
        {listings.map((ticket) => {
          const isMine = Boolean(userId) && ticket.owner_id === userId;
          const isPending = pendingId === ticket.id;

          return (
            <li key={ticket.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="font-medium">{ticketLabel(ticket)}</p>
                <p className="text-xs text-muted-foreground">
                  Face value {formatPrice(ticket.price_cents)}
                  {isMine && " · Your listing"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold">{formatPrice(ticket.list_price_cents)}</span>
                {isMine ? (
                  <Button size="sm" variant="danger" disabled={isPending} onClick={() => runAction(ticket.id, "unlist_ticket")}>
                    {isPending ? "Cancelling…" : "Cancel sale"}
                  </Button>
                ) : (
                  <Button size="sm" disabled={isPending} onClick={() => runAction(ticket.id, "buy_resale_ticket")}>
                    {isPending ? "Buying…" : "Buy"}
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
