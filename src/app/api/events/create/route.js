import connectDB from '@/lib/mongooseDB';
import Event from '@/models/Event';
import Venue from '@/models/Venue';
import TicketOwnership from '@/models/TicketOwnership';

export async function POST(request) {
    console.log("Event create Post request called");
    const data = await request.json();
    try {
        await connectDB();
        const venue = await Venue.findById(data.venue);
        if (!venue)
        {
          return new Response(JSON.stringify({ error: "Invalid venue ID" }), { status: 400 });
        }
        if (venue.totalSeats < 1 )
        {
          return new Response(JSON.stringify({ error: "Venue has no seats" }), { status: 400 });
        }
        console.log(JSON.stringify(data));
        const tickets = Array.from({length: venue.totalSeats}, (_, i) => ({

          seatNumber: i+1,
          price: data.ticketPrice || 50,
        }))

        const newEvent = await Event.create({...data, tickets});
        const ticketOwnerships = newEvent.tickets.map((ticket) => ({
          userID: newEvent.organizerId,
          eventID: newEvent._id,
          ticket: ticket._id,
        }));
        
        await TicketOwnership.insertMany(ticketOwnerships);
      return new Response(JSON.stringify(newEvent), { status: 201 });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }