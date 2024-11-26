import connectDB from "@/lib/mongooseDB";
import Venue from "@/models/Venue";

export async function GET(request){
    try{
        await connectDB();
        const venueList = await Venue.find({})

        return new Response(JSON.stringify(venueList), {status: 200})

    } catch(error){
        return new Response(JSON.stringify({error: error.message}), {status: 500})
    }
}