import Link from "next/link";
import { notFound } from "next/navigation";
import { History, MapPin, Mic2, Send, Tag, Ticket } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import EventImage from "@/components/EventImage";
import TicketList from "@/components/tickets/TicketList";
import Card from "@/components/ui/Card";
import Eyebrow from "@/components/ui/Eyebrow";
import { buttonClasses } from "@/components/ui/Button";
import { formatEventDate } from "@/lib/format";

// What Tixly does for ticket holders (shown in the side card).
const PERKS = [
  { icon: Tag, label: "Resell tickets", detail: "At your price" },
  { icon: Send, label: "Transfer to friends", detail: "By email" },
  { icon: History, label: "Every ticket tracked", detail: "Full history" },
];

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
  const ownedCount = userId ? tickets.filter((t) => t.owner_id === userId).length : 0;

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-8 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <Card className="p-6 sm:p-8">
        <Eyebrow>{event.category}</Eyebrow>
        <h1 className="mt-2 text-4xl font-medium tracking-tight sm:text-5xl">{event.name}</h1>
        <p className="mt-2 text-muted-foreground">
          {event.venue?.name} · {formatEventDate(event.starts_at)}
        </p>

        <div className="relative mt-6 aspect-[16/7] overflow-hidden rounded-panel">
          <EventImage event={event} priority sizes="(min-width: 1024px) 60vw, 100vw" />
        </div>

        <dl className="mt-6 grid gap-5 sm:grid-cols-3">
          <Detail icon={Mic2} label="Performing" value={event.artist ?? "To be announced"} note={`Organized by ${event.organizer?.name}`} />
          <Detail icon={MapPin} label="Venue" value={event.venue?.name} note={event.venue?.address} />
          <Detail
            icon={Ticket}
            label="Tickets left"
            value={`${unsoldCount} of ${tickets.length}`}
            note={resaleCount > 0 ? `${resaleCount} on resale` : "No resale tickets yet"}
          />
        </dl>

        <h2 className="mt-10 text-2xl font-medium tracking-tight">Choose your tickets</h2>
        <div className="mt-4">
          <TicketList tickets={tickets} userId={userId} />
        </div>
      </Card>

      <aside className="lg:sticky lg:top-24">
        <Card className="p-7">
          <div className="grid size-12 place-items-center rounded-2xl bg-secondary text-primary-text">
            <Ticket className="size-6" aria-hidden />
          </div>
          <h2 className="mt-5 text-3xl font-medium tracking-tight">Your night, sorted.</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {!userId
              ? "Sign in to buy tickets, resell them at your price, and keep them all in one place."
              : ownedCount > 0
                ? `You have ${ownedCount} ${ownedCount === 1 ? "ticket" : "tickets"} for this event.`
                : "Tickets you buy show up in My tickets."}
          </p>
          <ul className="my-6 divide-y divide-border border-y border-border">
            {PERKS.map(({ icon: Icon, label, detail }) => (
              <li key={label} className="flex items-center justify-between gap-4 py-3 text-sm">
                <span className="flex items-center gap-3 text-muted-foreground">
                  <Icon className="size-4 text-primary-text" aria-hidden /> {label}
                </span>
                <span className="font-semibold">{detail}</span>
              </li>
            ))}
          </ul>
          <Link href={userId ? "/myProfile" : "/login"} className={buttonClasses({ className: "w-full" })}>
            {userId ? "My tickets" : "Sign in"}
          </Link>
        </Card>
      </aside>
    </div>
  );
}

function Detail({ icon: Icon, label, value, note }) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-5 shrink-0 text-primary-text" aria-hidden />
      <div className="min-w-0">
        <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 font-medium">{value}</dd>
        {note && <dd className="text-sm text-muted-foreground">{note}</dd>}
      </div>
    </div>
  );
}
