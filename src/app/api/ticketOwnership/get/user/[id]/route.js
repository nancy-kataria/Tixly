//Get request for EventID
import connectDB from '@/lib/mongooseDB';
import Event from '@/models/Event';
import TicketOwnership from '@/models/TicketOwnership';
import Venue from '@/models/Venue';
import User from '@/models/Users';


export async function GET(req, {params}) {
    try {
        await connectDB();

        const {id: userID} = await params;

        if(!userID || userID ==="") return new Response(JSON.stringify({ error: "No UserID given" }), { status: 404 });

        //find tickets user owns
        const ownerships = await TicketOwnership.find({userID}).populate("ticket").exec();
        if(!ownerships || ownerships.length ===0)
        {
            return new Response(JSON.stringify({ error: "Ownerships not found" }), { status: 404 });
        }
        const ticketIds = ownerships.map((ownership) => ownership.ticket);

        const events = await Event.find({ "tickets._id": { $in: ticketIds } })
          .select("eventName eventDate tickets")
          .exec();
          const result = ownerships.map((ownership) => {
            const event = events.find((e) =>
              e.tickets.some((t) => t._id.toString() === ownership.ticket.toString()));

            const ticket = event?.tickets.find((t) => t._id.toString() === ownership.ticket.toString());
            return {
              eventID: event?._id,
              eventName: event?.eventName,
              eventDate: event?.eventDate,
              _id: ticket?._id,
              seatNumber: ticket?.seatNumber,
              price: ticket?.price,
              status: ticket?.status,
              isOwnedByUser:true,
            };
          });

      return new Response(JSON.stringify(result), { status: 201 });
    } catch (error) {
        console.log(error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }