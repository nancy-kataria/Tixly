import connectDB from "@/lib/mongooseDB";
import Event from "@/models/Event";

export async function GET(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    const eventList = await Event.find({ organizerId: id });

    return new Response(JSON.stringify(eventList), { status: 200 });
  } catch (error) {
    console.log(error.message);
    return new Response(JSON.stringify({error: error.message}), { status: 500 });
  }
}
