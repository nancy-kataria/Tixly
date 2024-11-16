import connectDB from '@/lib/mongooseDB';
import Event from '@/models/Event';
import Venue from '@/models/Venue';
import TicketOwnership from '@/models/TicketOwnership';


export async function POST(request, {params}) {
    const {id} = await params;
    const data = await request.json();

    try{
        
        await connectDB();
        
    }
    catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}