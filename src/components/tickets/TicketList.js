// components/TicketList.js
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ListTicketModal from "../Modals/ListTicketModal";
import TransferTicketModal from "../Modals/TransferTicketModal";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { formatEventDate, formatPrice } from "@/lib/format";

// tickets: [{ id, seat_number, price_cents, status, list_price_cents, owner_id,
//             event?: { id, name, starts_at } }]  (event is needed for viewType "user")
export default function TicketList({ tickets, userId, viewType = "event" }) {
  const router = useRouter();
  const [sortBy, setSortBy] = useState("status");
  const [modal, setModal] = useState(null); // { type: "list" | "transfer", ticket }
  const [pendingTicketId, setPendingTicketId] = useState(null);
  const [error, setError] = useState("");

  //Sorts the Tickets
  const sortedTickets = useMemo(
    () =>
      [...tickets].sort((a, b) =>
        sortBy === "seatNumber"
          ? a.seat_number - b.seat_number
          : a.status.localeCompare(b.status) || a.seat_number - b.seat_number
      ),
    [tickets, sortBy]
  );

  //Groups tickets by the event
  const ticketGroups =
    viewType === "user"
      ? Object.values(
          sortedTickets.reduce((groups, ticket) => {
            groups[ticket.event.id] ??= { event: ticket.event, tickets: [] };
            groups[ticket.event.id].tickets.push(ticket);
            return groups;
          }, {})
        )
      : [{ event: null, tickets: sortedTickets }];

  // Calls one of the ticket database functions, then re-fetches the page's
  // data. Resolves to an error message, or null on success.
  const runAction = async (ticketId, fn, args) => {
    setPendingTicketId(ticketId);
    const { error } = await createClient().rpc(fn, args);
    setPendingTicketId(null);
    if (error) return error.message;
    router.refresh();
    return null;
  };

  const handleAction = async (ticketId, fn, args) => {
    if (!userId) {
      router.push("/login");
      return;
    }
    setError("");
    const message = await runAction(ticketId, fn, args);
    if (message) setError(message);
  };

  if (tickets.length === 0) {
    return <p className="text-sm text-muted-foreground">No tickets yet.</p>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {tickets.length} {tickets.length === 1 ? "ticket" : "tickets"}
        </p>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Sort by
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-9 rounded-full border border-input bg-surface-strong px-3 text-foreground"
          >
            <option value="status">Status</option>
            <option value="seatNumber">Seat number</option>
          </select>
        </label>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-panel bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="space-y-8">
        {ticketGroups.map(({ event, tickets: groupTickets }) => (
          <div key={event?.id ?? "all"}>
            {event && (
              <Link href={`/event/${event.id}`} className="mb-3 inline-block font-medium hover:text-primary-text">
                {event.name}{" "}
                <span className="font-normal text-muted-foreground">· {formatEventDate(event.starts_at)}</span>
              </Link>
            )}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
              {groupTickets.map((ticket) => {
                const isMine = Boolean(userId) && ticket.owner_id === userId;
                const isPending = pendingTicketId === ticket.id;

                return (
                  <div
                    key={ticket.id}
                    className={cn(
                      "flex flex-col rounded-panel border bg-surface-strong p-3",
                      isMine ? "border-primary ring-2 ring-primary/30" : "border-surface-border"
                    )}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold">Seat {ticket.seat_number}</span>
                      {isMine && (
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-primary-text">
                          Yours
                        </span>
                      )}
                    </div>
                    <span className="mt-0.5 text-sm text-muted-foreground">
                      {ticket.status === "listed" ? (
                        <>
                          {formatPrice(ticket.list_price_cents)}{" "}
                          <span className="text-primary-text">resale</span>
                        </>
                      ) : (
                        formatPrice(ticket.price_cents)
                      )}
                    </span>

                    <div className="mt-3 flex flex-col gap-1.5">
                      {/* Unsold, or listed by someone else: "Buy" */}
                      {(ticket.status === "available" || (ticket.status === "listed" && !isMine)) && (
                        <Button
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleAction(ticket.id, "buy_ticket", { p_ticket_id: ticket.id })}
                        >
                          {isPending ? "Buying…" : "Buy"}
                        </Button>
                      )}
                      {/* Yours and not listed: "Sell" */}
                      {ticket.status === "sold" && isMine && (
                        <Button size="sm" variant="outline" disabled={isPending} onClick={() => setModal({ type: "list", ticket })}>
                          Sell
                        </Button>
                      )}
                      {/* Yours and listed: cancel the listing */}
                      {ticket.status === "listed" && isMine && (
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={isPending}
                          onClick={() => handleAction(ticket.id, "unlist_ticket", { p_ticket_id: ticket.id })}
                        >
                          {isPending ? "Cancelling…" : "Cancel sale"}
                        </Button>
                      )}
                      {/* Yours: transfer to another user */}
                      {isMine && (
                        <Button size="sm" variant="outline" disabled={isPending} onClick={() => setModal({ type: "transfer", ticket })}>
                          Transfer
                        </Button>
                      )}
                      {/* Owned by someone else and not for sale */}
                      {ticket.status === "sold" && !isMine && (
                        <Button size="sm" variant="outline" disabled>
                          Sold
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {modal?.type === "list" && (
        <ListTicketModal
          ticket={modal.ticket}
          onClose={() => setModal(null)}
          onConfirm={(priceCents) =>
            runAction(modal.ticket.id, "list_ticket", {
              p_ticket_id: modal.ticket.id,
              p_price_cents: priceCents,
            })
          }
        />
      )}
      {modal?.type === "transfer" && (
        <TransferTicketModal
          ticket={modal.ticket}
          onClose={() => setModal(null)}
          onConfirm={(email) =>
            runAction(modal.ticket.id, "transfer_ticket", {
              p_ticket_id: modal.ticket.id,
              p_recipient_email: email,
            })
          }
        />
      )}
    </div>
  );
}
