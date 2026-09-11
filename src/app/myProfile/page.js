import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import avatar from "../../../public/avatar.png";
import { createClient } from "@/lib/supabase/server";
import EventList from "@/components/EventList";
import TicketList from "@/components/tickets/TicketList";
import BecomeOrganizerButton from "@/components/BecomeOrganizerButton";
import Card from "@/components/ui/Card";
import Eyebrow from "@/components/ui/Eyebrow";
import { buttonClasses } from "@/components/ui/Button";
import { formatPrice, ticketLabel } from "@/lib/format";

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
    supabase.from("profiles").select("name, role, avatar_url").eq("id", userId).single(),
    supabase
      .from("tickets")
      .select("id, number, price_cents, status, list_price_cents, section:ticket_sections(name), event:events(id, name, starts_at)")
      .eq("owner_id", userId),
    // RLS limits this to transactions the user is part of.
    supabase
      .from("ticket_transactions")
      .select("id, kind, price_cents, created_at, from_user, to_user, ticket:tickets(number, section:ticket_sections(name), event:events(id, name))")
      .order("created_at", { ascending: false }),
  ]);

  const profile = profileResult.data;
  const isOrganizer = profile?.role === "organizer";
  const { data: events } = isOrganizer
    ? await supabase.from("event_summaries").select("*").eq("organizer_id", userId).order("starts_at")
    : { data: [] };
  const transactions = transactionsResult.data ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-10">
      <Card className="flex flex-wrap items-center gap-5 p-6 sm:p-8">
        <div className="relative size-16 overflow-hidden rounded-full ring-4 ring-surface-border">
          <Image src={profile?.avatar_url || avatar} alt="" fill sizes="64px" className="object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-medium tracking-tight">{profile?.name}</h1>
          <span className="mt-1 inline-block rounded-full bg-secondary px-3 py-0.5 text-xs font-semibold capitalize text-secondary-foreground">
            {profile?.role}
          </span>
        </div>
        {isOrganizer ? (
          <Link href="/createEvent" className={buttonClasses()}>
            Create event
          </Link>
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-sm text-muted-foreground">Want to sell tickets for your own events?</p>
            <BecomeOrganizerButton />
          </div>
        )}
      </Card>

      {isOrganizer && (
        <section>
          <Eyebrow>Organizer</Eyebrow>
          <h2 className="mb-5 mt-1 text-3xl font-medium tracking-tight">Your events</h2>
          <EventList events={events} emptyMessage="You haven't created any events yet." />
        </section>
      )}

      <Card as="section" className="p-6 sm:p-8">
        <h2 className="mb-5 text-3xl font-medium tracking-tight">Your tickets</h2>
        <TicketList tickets={ticketsResult.data ?? []} />
      </Card>

      {/*Transaction List */}
      <Card as="section" className="p-6 sm:p-8">
        <h2 className="mb-5 text-3xl font-medium tracking-tight">Transaction history</h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No transactions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="py-3 pr-4 font-semibold">Date</th>
                  <th className="py-3 pr-4 font-semibold">Event</th>
                  <th className="py-3 pr-4 font-semibold">Ticket</th>
                  <th className="py-3 pr-4 font-semibold">What happened</th>
                  <th className="py-3 text-right font-semibold">Price</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-border last:border-0">
                    <td className="py-3 pr-4 text-muted-foreground">
                      {new Date(transaction.created_at).toLocaleDateString("en-US")}
                    </td>
                    <td className="py-3 pr-4">
                      <Link href={`/event/${transaction.ticket.event.id}`} className="font-medium hover:text-primary-text">
                        {transaction.ticket.event.name}
                      </Link>
                    </td>
                    <td className="py-3 pr-4">{ticketLabel(transaction.ticket)}</td>
                    <td className="py-3 pr-4">{describeTransaction(transaction, userId)}</td>
                    <td className="py-3 text-right font-medium">
                      {transaction.price_cents === null ? "—" : formatPrice(transaction.price_cents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
