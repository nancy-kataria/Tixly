import connectDB from '@/lib/mongooseDB';
import Event from '@/models/Event';
import TicketOwnership from '@/models/TicketOwnership';


export async function PUT(request, {params}) {
    const {id} = await params;
    const data = await request.json();
    try{
        
        await connectDB();
        //data.userID = "6726641a5a236e36bda36344";
        const updatedOwnership =  await TicketOwnership.findOneAndUpdate({"ticket": id}, {userID: data.userID}, {new: true});
        if(!updatedOwnership)
        {
            return new Response(JSON.stringify({ error: "Ticket ownership not found" }), { status: 404 });
        }
        const event = await Event.findOneAndUpdate({"tickets._id": id}, {$set:{"tickets.$.status": "Sold"}}, {new:true});
        if (!event)
        {
            return new Response(JSON.stringify({ error: "Event Ticket not found" }), { status: 404 });
        }

        return new Response(JSON.stringify({ success: true, updatedOwnership, event }), { status: 200 });
    }
    catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}