import Link from "next/link";
import Image from "next/image";
import concert from "../../public/concert.jpg";
import { formatEventDate } from "@/lib/format";

// events: [{ id, name, category, starts_at, venue: { name } }]
export default function EventList({ events, emptyMessage = "No events yet" }) {
  if (!events || events.length === 0) {
    return <p className="text-sm font-medium">{emptyMessage}</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
      {events.map((event) => (
        <Link
          key={event.id}
          href={`/event/${event.id}`}
          className="w-full max-w-lg p-4 bg-white border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left"
        >
          {/* Event Image */}
          <Image
            src={concert}
            alt="concert-image"
            className="w-100 h-100 rounded-lg object-cover"
          />

          {/* Event Details */}
          <div className="mt-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {event.category}
            </span>
            <h2 className="text-xl font-bold text-gray-800">{event.name}</h2>

            {/* Date and Venue */}
            <div className="text-gray-600 mt-2">
              <p className="text-sm font-medium">
                📅 {formatEventDate(event.starts_at)}
              </p>
              <p className="text-sm font-medium">📍 {event.venue?.name}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
