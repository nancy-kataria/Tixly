//Get request for EventID
import connectDB from '@/lib/mongooseDB';
import Event from '@/models/Event';
import TicketOwnership from '@/models/TicketOwnership';
import Venue from '@/models/Venue';
import User from '@/models/Users';


export async function GET(req, {params}) {
    try {
        await connectDB();

        const {id: eventID} = await params;

        const url = new URL(req.url, `http://${req.headers.host}`);
        const userID = url.searchParams.get("userID");

        const event = await Event.findById(eventID)
        .populate("organizerId").populate("venue").exec();
      if (!event)
        return new Response(JSON.stringify({ error: "Event not found" }), { status: 404 });

      let tickets = event.tickets;

      if(userID && userID !="") {
        //find tickets user owns
        const ownershipDetails = await TicketOwnership.find({eventID});

        tickets = tickets.map((ticket)=> {
          const ownership = ownershipDetails.find((o)=> o.ticket.toString() === ticket._id.toString());

          return {
            ...ticket.toObject(),
            isOwnedByUser: ownership ? ownership.userID.toString() === userID : false,
          }
        });
      }
      return new Response(JSON.stringify({event, tickets}), { status: 201 });
    } catch (error) {
        console.log(error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }