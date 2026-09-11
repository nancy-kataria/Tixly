import Link from "next/link";
import { notFound } from "next/navigation";
import { History, MapPin, Mic2, Send, Tag, Ticket } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import EventImage from "@/components/EventImage";
import SectionPicker from "@/components/tickets/SectionPicker";
import ResaleList from "@/components/tickets/ResaleList";
import { EventAvailabilityProvider, LiveBadge, LiveTicketsLeft } from "@/components/tickets/EventAvailability";
import Card from "@/components/ui/Card";
import Detail from "@/components/ui/Detail";
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

  const [eventResult, sectionsResult, listingsResult, claimsResult] = await Promise.all([
    supabase
      .from("events")
      .select("id, name, artist, category, starts_at, venue:venues(name, address), organizer:profiles(name)")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("section_availability").select("*").eq("event_id", id).order("sort_order"),
    supabase
      .from("tickets")
      .select("id, number, price_cents, list_price_cents, owner_id, held_by, held_until, section:ticket_sections(name)")
      .eq("event_id", id)
      .eq("status", "listed")
      .order("list_price_cents")
      .limit(50),
    supabase.auth.getClaims(),
  ]);

  // Also covers ids that aren't valid UUIDs, which make the query error.
  const event = eventResult.data;
  if (!event) notFound();

  const sections = sectionsResult.data ?? [];
  const userId = claimsResult.data?.claims?.sub ?? null;

  // Hide resale tickets sitting in someone else's cart; flag ones in yours.
  const now = new Date();
  const listings = (listingsResult.data ?? [])
    .map((ticket) => ({
      ...ticket,
      isHeld: ticket.held_until !== null && new Date(ticket.held_until) > now,
    }))
    .filter((ticket) => !ticket.isHeld || ticket.held_by === userId)
    .map(({ held_by, held_until, isHeld, ...ticket }) => ({ ...ticket, inMyCart: isHeld }));

  const { count: ownedCount } = userId
    ? await supabase
        .from("tickets")
        .select("id", { count: "exact", head: true })
        .eq("event_id", id)
        .eq("owner_id", userId)
    : { count: 0 };

  const hasStarted = new Date(event.starts_at) <= now;

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-8 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <EventAvailabilityProvider eventId={event.id} initialSections={sections}>
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
            <LiveTicketsLeft />
          </dl>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-medium tracking-tight">Choose your tickets</h2>
            <LiveBadge />
          </div>
          {hasStarted && <p className="mt-1 text-sm text-muted-foreground">This event has already started.</p>}
          <div className="mt-4">
            <SectionPicker userId={userId} hasStarted={hasStarted} />
          </div>

          <h2 className="mt-10 text-2xl font-medium tracking-tight">Resale tickets</h2>
          <p className="mt-1 text-sm text-muted-foreground">Sold by other fans, at the price they set.</p>
          <div className="mt-4">
            <ResaleList listings={listings} userId={userId} />
          </div>
        </Card>
      </EventAvailabilityProvider>

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
