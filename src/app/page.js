import Link from "next/link";
import { Search, Sparkles } from "lucide-react";
import EventImage from "@/components/EventImage";
import EventList from "@/components/EventList";
import Card from "@/components/ui/Card";
import Chip from "@/components/ui/Chip";
import Eyebrow from "@/components/ui/Eyebrow";
import { buttonClasses } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { formatEventDate, formatPrice, priceLabel } from "@/lib/format";

const CATEGORIES = [
  { value: "", label: "All events" },
  { value: "music", label: "Music" },
  { value: "sports", label: "Sports" },
  { value: "comedy", label: "Comedy" },
  { value: "theater", label: "Theater" },
];

// The search term and category live in the URL (?q=...&category=...).
function homeHref({ q, category }) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  const query = params.toString();
  return `/${query ? `?${query}` : ""}#events`;
}

export default async function HomePage({ searchParams }) {
  const { q = "", category = "" } = await searchParams;
  const search = q.trim();
  const activeCategory = CATEGORIES.some((c) => c.value === category) ? category : "";
  const isFiltered = Boolean(search || activeCategory);

  const supabase = await createClient();
  const now = new Date();

  // Upcoming events, most tickets sold first.
  const trendingQuery = supabase
    .from("event_summaries")
    .select("*")
    .gte("starts_at", now.toISOString())
    .order("sold_count", { ascending: false })
    .order("starts_at");

  let filteredQuery = null;
  if (isFiltered) {
    filteredQuery = supabase
      .from("event_summaries")
      .select("*")
      .gte("starts_at", now.toISOString())
      .order("starts_at");
    if (activeCategory) filteredQuery = filteredQuery.eq("category", activeCategory);
    if (search) {
      // Strip characters that would break PostgREST's or() filter syntax.
      const term = search.replace(/[,()*"\\]/g, " ");
      filteredQuery = filteredQuery.or(
        `name.ilike.%${term}%,artist.ilike.%${term}%,venue_name.ilike.%${term}%`
      );
    }
  }

  const [trendingResult, filteredResult, venuesResult] = await Promise.all([
    trendingQuery,
    filteredQuery ?? { data: null },
    supabase.from("venues").select("*", { count: "exact", head: true }),
  ]);
  if (trendingResult.error) console.error("Failed to load events:", trendingResult.error);
  if (filteredResult.error) console.error("Failed to search events:", filteredResult.error);

  const trending = trendingResult.data ?? [];
  const featured = trending[0];
  const events = isFiltered ? filteredResult.data ?? [] : trending.slice(1);
  const ticketsSold = trending.reduce((sum, event) => sum + event.sold_count, 0);
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const isLiveThisWeek = trending.some((event) => new Date(event.starts_at) < weekFromNow);

  const heading = search
    ? `Results for “${search}”`
    : activeCategory
      ? CATEGORIES.find((c) => c.value === activeCategory).label
      : "Trending now";

  return (
    <div className="mx-auto max-w-7xl px-6">
      {/* Hero */}
      {/* minmax(0, ...) columns let content shrink instead of stretching the grid */}
      <section className="grid grid-cols-1 items-center gap-12 py-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <Card className="p-6 sm:p-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-secondary/70 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-text">
            <Sparkles className="size-3.5" aria-hidden />
            {isLiveThisWeek ? "Live this week" : "On sale now"}
          </span>
          <h1 className="mt-6 text-4xl font-medium leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
            Find your next <span className="text-primary-display">unforgettable</span> night.
          </h1>
          <p className="mt-6 max-w-md text-lg text-muted-foreground">
            Concerts, games, comedy and theater worth crossing the city for, all in one place.
          </p>

          {/* Search: a plain GET form, so results live in the URL */}
          <form action="/" className="glass-strong mt-8 flex items-center gap-3 rounded-full p-1.5 pl-5">
            <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden />
            {activeCategory && <input type="hidden" name="category" value={activeCategory} />}
            <input
              type="search"
              name="q"
              defaultValue={search}
              placeholder="Artists, venues, or events"
              aria-label="Search events"
              className="h-10 min-w-0 flex-1 bg-transparent placeholder:text-muted-foreground focus:outline-none"
            />
            <button type="submit" className={buttonClasses()}>
              Search
            </button>
          </form>

          <div className="mt-5 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Chip key={c.value} href={homeHref({ q: search, category: c.value })} active={activeCategory === c.value}>
                {c.label}
              </Chip>
            ))}
          </div>

          <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-t border-border pt-6">
            <Stat value={trending.length} label="upcoming events" />
            <Stat value={venuesResult.count ?? 0} label="venues" />
            <Stat value={ticketsSold} label="tickets sold" />
          </dl>
        </Card>

        {featured && <FeaturedEvent event={featured} />}
      </section>

      {/* Events */}
      <section id="events" className="scroll-mt-24 pt-10">
        <Eyebrow>{isFiltered ? "Upcoming events" : "Curated for you"}</Eyebrow>
        <div className="mb-6 mt-1 flex items-end justify-between gap-4">
          <h2 className="text-4xl font-medium tracking-tight sm:text-5xl">{heading}</h2>
          <p className="shrink-0 text-sm text-muted-foreground">
            {events.length} {events.length === 1 ? "event" : "events"}
          </p>
        </div>
        <EventList
          events={events}
          emptyMessage={isFiltered ? "No upcoming events match. Try another search." : "No other upcoming events yet."}
        />
      </section>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd className="text-3xl tracking-tight">{value.toLocaleString("en-US")}</dd>
      <dd className="text-sm text-muted-foreground">{label}</dd>
    </div>
  );
}

function FeaturedEvent({ event }) {
  return (
    <Link href={`/event/${event.id}`} className="group relative block lg:ml-6">
      <Card className="p-4">
        <div className="relative aspect-[4/3] overflow-hidden rounded-panel">
          <EventImage
            event={event}
            priority
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="transition duration-500 group-hover:scale-105"
          />
        </div>
        <div className="flex items-end justify-between gap-4 px-2 pb-2 pt-5">
          <div className="min-w-0">
            <h3 className="text-3xl font-medium tracking-tight">{event.name}</h3>
            <p className="mt-1 text-muted-foreground">
              {event.venue_name} · {formatEventDate(event.starts_at)}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-primary-text">
            {priceLabel(event.from_price_cents)}
          </span>
        </div>
      </Card>

      {/* Sits over the image's corner, clear of the title */}
      <div className="glass-strong absolute -left-4 top-8 rounded-panel px-4 py-3 sm:-left-8">
        <Eyebrow>Selling now</Eyebrow>
        <p className="mt-0.5 text-lg font-medium">{event.available_count} tickets left</p>
        <p className="text-xs text-muted-foreground">
          {event.resale_count > 0
            ? `${event.resale_count} on resale`
            : event.from_price_cents === null
              ? "Check back for resale"
              : `Face value ${formatPrice(event.from_price_cents)}`}
        </p>
      </div>
    </Link>
  );
}
