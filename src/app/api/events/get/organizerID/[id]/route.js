import connectDB from "@/lib/mongooseDB";
import Event from "@/models/Event";

export async function GET(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    const events = await Event.find({ organizerId: id })
      .populate({
        path: "venue",
        select: "name address",
      })
      .exec();

      const eventList = events.map(event => ({
        _id: event._id,
        eventName: event.eventName,
        eventDate: event.eventDate ? event.eventDate: null,
        venue: event.venue ? event.venue.name : null,
        address: event.venue ? event.venue.address : null,
    }));

    return new Response(JSON.stringify(eventList), { status: 200 });
  } catch (error) {
    console.log(error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
