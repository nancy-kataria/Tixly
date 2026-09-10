import Image from "next/image";
import { notFound } from "next/navigation";
import concert from "../../../../public/concert.jpg";
import { createClient } from "@/lib/supabase/server";
import TicketList from "@/components/tickets/TicketList";
import { formatEventDate } from "@/lib/format";

export default async function EventPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const [eventResult, ticketsResult, claimsResult] = await Promise.all([
    supabase
      .from("events")
      .select("id, name, artist, category, starts_at, venue:venues(name, address, capacity), organizer:profiles(name)")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("tickets")
      .select("id, seat_number, price_cents, status, list_price_cents, owner_id")
      .eq("event_id", id)
      .order("seat_number"),
    supabase.auth.getClaims(),
  ]);

  // Also covers ids that aren't valid UUIDs, which make the query error.
  const event = eventResult.data;
  if (!event) notFound();

  const tickets = ticketsResult.data ?? [];
  const userId = claimsResult.data?.claims?.sub ?? null;
  const unsoldCount = tickets.filter((t) => t.status === "available").length;
  const resaleCount = tickets.filter((t) => t.status === "listed").length;

  return (
    <div>
      <div className="flex items-center bg-gray-100 p-8">
        {/* Event Image */}
        <div className="w-full max-w-2xl">
          <Image
            src={concert}
            alt="concert-image"
            className="w-30 h-30 rounded-lg object-cover"
          />
        </div>

        {/* Event Details */}
        <div className="w-full max-w-2xl bg-white mt-6 p-6 rounded-lg shadow-lg">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {event.category}
          </span>
          <h1 className="text-3xl font-bold text-gray-800">{event.name}</h1>
          <h1 className="text-xl font-bold text-gray-800">{event.artist}</h1>
          <p className="text-gray-600 mt-2">
            <span className="font-semibold">📍 Venue:</span> {event.venue?.name}
          </p>
          <p className="text-gray-600 mt-1">
            <span className="font-semibold">📌 Address:</span> {event.venue?.address}
          </p>
          <p className="text-gray-600 mt-1">
            <span className="font-semibold">📅 Date:</span> {formatEventDate(event.starts_at)}
          </p>
          <p className="text-gray-600 mt-1">
            <span className="font-semibold">🎫 Tickets:</span> {unsoldCount} of{" "}
            {tickets.length} available
            {resaleCount > 0 && `, ${resaleCount} on resale`}
          </p>
          <p className="text-gray-600 mt-1">
            <span className="font-semibold">🎤 Organized by:</span> {event.organizer?.name}
          </p>
        </div>
      </div>

      {/* Ticket List Container */}
      <div className="min-h-screen bg-gray-100 p-8">
        <TicketList tickets={tickets} userId={userId} />
      </div>
    </div>
  );
}
