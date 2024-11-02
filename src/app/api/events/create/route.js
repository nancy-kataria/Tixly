import connectDB from '@/lib/mongooseDB';
import Event from '@/models/Event';


export async function POST(request) {
    console.log("Event create Post request called");
    const data = await request.json();
    try {
        await connectDB();
      const newEvent = await Event.create(data);
      
      return new Response(JSON.stringify(newEvent), { status: 201 });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }