//Get request for EventID
import connectDB from '@/lib/mongooseDB';
import Event from '@/models/Event';
import Venue from '@/models/Venue';
import User from '@/models/Users';


export async function GET(request, {params}) {
    try {
        await connectDB();

        const {id} = await params;

        const event = await Event.findById(id)
        .populate("organizerId").populate("venue").exec();

      if (!event)
        return new Response(JSON.stringify({ error: "Event not found" }), { status: 404 });
      return new Response(JSON.stringify(event), { status: 201 });
    } catch (error) {
        console.log(error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }