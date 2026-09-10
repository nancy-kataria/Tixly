import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EventList from "@/components/EventList";
import TicketList from "@/components/tickets/TicketList";
import BecomeOrganizerButton from "@/components/BecomeOrganizerButton";
import { formatPrice } from "@/lib/format";

function describeTransaction(transaction, userId) {
  const received = transaction.to_user === userId;
  switch (transaction.kind) {
    case "purchase":
      return "Bought from the event";
    case "resale":
      return received ? "Bought on resale" : "Sold on resale";
    case "transfer":
      return received ? "Received as a transfer" : "Transferred to another user";
  }
}

export default async function MyProfile() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  // src/proxy.js already redirects signed-out users; this is a fallback.
  if (!userId) redirect("/login");

  const [profileResult, ticketsResult, transactionsResult] = await Promise.all([
    supabase.from("profiles").select("name, role").eq("id", userId).single(),
    supabase
      .from("tickets")
      .select("id, seat_number, price_cents, status, list_price_cents, owner_id, event:events(id, name, starts_at)")
      .eq("owner_id", userId),
    // RLS limits this to transactions the user is part of.
    supabase
      .from("ticket_transactions")
      .select("id, kind, price_cents, created_at, from_user, to_user, ticket:tickets(seat_number, event:events(id, name))")
      .order("created_at", { ascending: false }),
  ]);

  const profile = profileResult.data;
  const isOrganizer = profile?.role === "organizer";
  const { data: events } = isOrganizer
    ? await supabase
        .from("events")
        .select("id, name, category, starts_at, venue:venues(name)")
        .eq("organizer_id", userId)
        .order("starts_at")
    : { data: [] };
  const transactions = transactionsResult.data ?? [];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="text-gray-800 mx-4 pb-8">
        <h3 className="text-2xl font-bold pt-4">{profile?.name}</h3>
        <p className="text-lg font-medium capitalize">{profile?.role}</p>

        {!isOrganizer && (
          <div className="mt-4 p-4 bg-white rounded-lg shadow-md max-w-xl space-y-3">
            <p>Want to sell tickets for your own events?</p>
            <BecomeOrganizerButton />
          </div>
        )}

        {isOrganizer && (
          <>
            <div className="flex items-center justify-between py-4">
              <h3 className="text-2xl font-bold">Your Event List</h3>
              <Link
                href="/createEvent"
                className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
              >
                Create event
              </Link>
            </div>
            <EventList events={events} emptyMessage="You haven't created any events yet" />
          </>
        )}

        <h3 className="text-2xl font-bold py-4">Your Ticket List</h3>
        <TicketList tickets={ticketsResult.data ?? []} userId={userId} viewType="user" />

        {/*Transaction List */}
        <h2 className="text-2xl font-bold py-4">Transaction List</h2>
        {transactions.length === 0 ? (
          <p>No Transactions to show</p>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-gray-500 border-b">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Event</th>
                  <th className="p-3">Seat</th>
                  <th className="p-3">What happened</th>
                  <th className="p-3">Price</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b last:border-0">
                    <td className="p-3">
                      {new Date(transaction.created_at).toLocaleDateString("en-US")}
                    </td>
                    <td className="p-3">
                      <Link href={`/event/${transaction.ticket.event.id}`} className="underline">
                        {transaction.ticket.event.name}
                      </Link>
                    </td>
                    <td className="p-3">{transaction.ticket.seat_number}</td>
                    <td className="p-3">{describeTransaction(transaction, userId)}</td>
                    <td className="p-3">
                      {transaction.price_cents === null ? "—" : formatPrice(transaction.price_cents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
