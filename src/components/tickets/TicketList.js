// components/TicketList.js
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ListTicketModal from "../Modals/ListTicketModal";
import TransferTicketModal from "../Modals/TransferTicketModal";
import Button from "@/components/ui/Button";
import { formatEventDate, formatPrice, ticketLabel } from "@/lib/format";

// The signed-in user's own tickets, grouped by event, with sell, cancel and
// transfer actions.
// tickets: [{ id, number, price_cents, status, list_price_cents,
//             section: { name }, event: { id, name, starts_at } }]
export default function TicketList({ tickets }) {
  const router = useRouter();
  const [modal, setModal] = useState(null); // { type: "list" | "transfer", ticket }
  const [pendingTicketId, setPendingTicketId] = useState(null);
  const [error, setError] = useState("");

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

  const handleCancelSale = async (ticketId) => {
    setError("");
    const message = await runAction(ticketId, "unlist_ticket", { p_ticket_id: ticketId });
    if (message) setError(message);
  };

  if (tickets.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No tickets yet.{" "}
        <Link href="/#events" className="font-medium text-primary-text hover:underline">
          Find an event
        </Link>
      </p>
    );
  }

  // Soonest event first; within an event, by section, then ticket number.
  const sortedTickets = [...tickets].sort(
    (a, b) =>
      a.event.starts_at.localeCompare(b.event.starts_at) ||
      a.section.name.localeCompare(b.section.name) ||
      a.number - b.number
  );
  const ticketGroups = Object.values(
    sortedTickets.reduce((groups, ticket) => {
      groups[ticket.event.id] ??= { event: ticket.event, tickets: [] };
      groups[ticket.event.id].tickets.push(ticket);
      return groups;
    }, {})
  );

  return (
    <div>
      {error && (
        <p role="alert" className="mb-4 rounded-panel bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="space-y-8">
        {ticketGroups.map(({ event, tickets: groupTickets }) => (
          <div key={event.id}>
            <Link href={`/event/${event.id}`} className="mb-3 inline-block font-medium hover:text-primary-text">
              {event.name}{" "}
              <span className="font-normal text-muted-foreground">· {formatEventDate(event.starts_at)}</span>
            </Link>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {groupTickets.map((ticket) => {
                const isListed = ticket.status === "listed";
                const isPending = pendingTicketId === ticket.id;

                return (
                  <div
                    key={ticket.id}
                    className="flex flex-col rounded-panel border border-surface-border bg-surface-strong p-4"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold">{ticketLabel(ticket)}</span>
                      {isListed && (
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary-text">
                          On resale
                        </span>
                      )}
                    </div>
                    <span className="mt-0.5 text-sm text-muted-foreground">
                      {isListed
                        ? `Listed at ${formatPrice(ticket.list_price_cents)}`
                        : `Face value ${formatPrice(ticket.price_cents)}`}
                    </span>

                    <div className="mt-4 flex gap-2">
                      {isListed ? (
                        <Button
                          size="sm"
                          variant="danger"
                          className="flex-1"
                          disabled={isPending}
                          onClick={() => handleCancelSale(ticket.id)}
                        >
                          {isPending ? "Cancelling…" : "Cancel sale"}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          disabled={isPending}
                          onClick={() => setModal({ type: "list", ticket })}
                        >
                          Sell
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        disabled={isPending}
                        onClick={() => setModal({ type: "transfer", ticket })}
                      >
                        Transfer
                      </Button>
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
