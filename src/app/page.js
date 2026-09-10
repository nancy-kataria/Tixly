import EventList from "@/components/EventList";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage({ searchParams }) {
  const { q = "" } = await searchParams;
  const search = q.trim();

  const supabase = await createClient();
  let query = supabase
    .from("events")
    .select("id, name, category, starts_at, venue:venues(name)")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at");
  if (search) query = query.ilike("name", `%${search}%`);

  const { data: events, error } = await query;
  if (error) console.error("Failed to load events:", error);

  return (
    <div
      style={{ padding: "2rem", textAlign: "center" }}
      className="min-h-screen bg-gray-100 text-gray-800"
    >
      <h2 className="text-4xl font-bold text-gray-800 mb-4">
        Welcome to Tixly!
      </h2>
      <p>Shop Hundreds Of Live Events And Discover Can&apos;t-Miss Concerts, Games, Theater And More.</p>
      {/* Search Bar: a plain GET form, so results live in the URL (?q=...) */}
      <form action="/">
        <input
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Search for events..."
          className="rounded"
          style={{ padding: "0.5rem", width: "60%", margin: "1.5rem 1rem" }}
        />
        <button type="submit" className="bg-black text-white rounded" style={{ padding: "0.5rem 1rem" }}>
          Search
        </button>
      </form>
      {/* Display search results */}
      <EventList
        events={events ?? []}
        emptyMessage={search ? `No upcoming events match "${search}"` : "No upcoming events yet"}
      />
    </div>
  );
}
