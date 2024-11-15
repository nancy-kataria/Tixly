import connectDB from "@/lib/mongooseDB";
import Event from "@/models/Event";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");
  const sortBy = searchParams.get("sortBy") || "status";

  try {
    await connectDB();
    const event = await Event.findById(eventId).select("tickets");
    if (!event) {
      return new Response(JSON.stringify({ error: "Event not found" }), { status: 404 });
    }

    const sortedTickets = [...event.tickets].sort((a, b) => a[sortBy].localeCompare(b[sortBy]));
    return new Response(JSON.stringify(sortedTickets), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
