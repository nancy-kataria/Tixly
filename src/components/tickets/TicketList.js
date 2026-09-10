// components/TicketList.js
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ListTicketModal from "../Modals/ListTicketModal";
import TransferTicketModal from "../Modals/TransferTicketModal";
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
    return <p className="text-sm font-medium">No Tickets yet</p>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-gray-800 mt-1 text-xl font-bold">Tickets</h2>
        <div>
          <label htmlFor="sort" className="text-gray-600 mt-1">
            Sort By:{" "}
          </label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-gray-600 mt-1"
          >
            <option value="status">Status</option>
            <option value="seatNumber">Seat Number</option>
          </select>
        </div>
      </div>

      {error && (
        <p className="mb-4 p-3 rounded bg-red-50 text-red-700 text-sm">{error}</p>
      )}

      {ticketGroups.map(({ event, tickets: groupTickets }) => (
        <div key={event?.id ?? "all"} className="mt-6 bg-white rounded-lg p-4 shadow-md">
          {event && (
            <Link
              href={`/event/${event.id}`}
              className="block text-gray-800 underline text-lg font-semibold mb-4 hover:text-blue-700"
            >
              {event.name} · {formatEventDate(event.starts_at)}
            </Link>
          )}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {groupTickets.map((ticket) => {
              const isMine = Boolean(userId) && ticket.owner_id === userId;
              const isPending = pendingTicketId === ticket.id;
              const buttonClass =
                "mt-2 w-full px-2 py-1 rounded text-sm text-white disabled:opacity-60";

              return (
                <div
                  key={ticket.id}
                  className={`text-gray-600 mt-1 rounded shadow-md flex flex-col items-center p-2 ${
                    isMine ? "ring-2 ring-blue-400" : ""
                  }`}
                >
                  <span className="text-lg font-semibold">
                    Seat {ticket.seat_number}
                  </span>

                  {ticket.status === "listed" ? (
                    <span className="mt-1 text-sm">
                      {formatPrice(ticket.list_price_cents)}{" "}
                      <span className="text-xs text-blue-600">resale</span>
                    </span>
                  ) : (
                    <span className="mt-1 text-sm">{formatPrice(ticket.price_cents)}</span>
                  )}
                  {isMine && <span className="text-xs text-blue-600">Your ticket</span>}

                  {/* Unsold, or listed by someone else: "Buy" */}
                  {(ticket.status === "available" ||
                    (ticket.status === "listed" && !isMine)) && (
                    <button
                      disabled={isPending}
                      onClick={() =>
                        handleAction(ticket.id, "buy_ticket", { p_ticket_id: ticket.id })
                      }
                      className={`${buttonClass} bg-green-500`}
                    >
                      {isPending ? "…" : "Buy"}
                    </button>
                  )}
                  {/* Yours and not listed: "Sell" */}
                  {ticket.status === "sold" && isMine && (
                    <button
                      disabled={isPending}
                      onClick={() => setModal({ type: "list", ticket })}
                      className={`${buttonClass} bg-yellow-500`}
                    >
                      Sell
                    </button>
                  )}
                  {/* Yours and listed: "Cancel" the listing */}
                  {ticket.status === "listed" && isMine && (
                    <button
                      disabled={isPending}
                      onClick={() =>
                        handleAction(ticket.id, "unlist_ticket", { p_ticket_id: ticket.id })
                      }
                      className={`${buttonClass} bg-red-500`}
                    >
                      {isPending ? "…" : "Cancel sale"}
                    </button>
                  )}
                  {/* Yours: "Transfer" to another user */}
                  {isMine && (
                    <button
                      disabled={isPending}
                      onClick={() => setModal({ type: "transfer", ticket })}
                      className={`${buttonClass} bg-yellow-600`}
                    >
                      Transfer
                    </button>
                  )}
                  {/* Owned by someone else and not for sale */}
                  {ticket.status === "sold" && !isMine && (
                    <button
                      disabled
                      className={`${buttonClass} bg-gray-500 cursor-not-allowed`}
                    >
                      Unavailable
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

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
