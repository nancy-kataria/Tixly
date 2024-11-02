
import connectDB from '@/lib/mongooseDB';
import Venue from '@/models/Venue';

export async function GET(request, {params}) {
  try {
    console.log("Venue ID Get request called");

    const { id } = await params;

    await connectDB();

    const venue = await Venue.findById( id);
    if (!venue) {
      return new Response(JSON.stringify({ error: "Venue not found" }), { status: 404 });
    }
    return new Response(JSON.stringify(venue), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
