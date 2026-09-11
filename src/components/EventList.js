import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import EventImage from "@/components/EventImage";
import Card from "@/components/ui/Card";
import Eyebrow from "@/components/ui/Eyebrow";
import { formatDay, priceLabel } from "@/lib/format";

// events: rows from the event_summaries view
export default function EventList({ events, emptyMessage = "No events yet" }) {
  if (!events || events.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {events.map((event) => (
        <Link key={event.id} href={`/event/${event.id}`} className="group">
          <Card className="flex h-full flex-col p-3 transition duration-300 group-hover:-translate-y-1">
            {/* Event Image */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-panel">
              <EventImage
                event={event}
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="transition duration-500 group-hover:scale-105"
              />
            </div>

            {/* Event Details */}
            <div className="flex flex-1 flex-col px-2 pb-2 pt-4">
              <Eyebrow>{event.category}</Eyebrow>
              <h3 className="mt-1 text-2xl font-medium leading-tight tracking-tight">{event.name}</h3>
              <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="size-4 shrink-0" aria-hidden /> {formatDay(event.starts_at)}
              </p>
              <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="size-4 shrink-0" aria-hidden /> {event.venue_name}
              </p>
              <div className="mt-auto flex items-center justify-between pt-5">
                <span className="font-semibold">{priceLabel(event.from_price_cents)}</span>
                <ArrowRight className="size-5 transition group-hover:translate-x-1" aria-hidden />
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
