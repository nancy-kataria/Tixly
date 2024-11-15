import connectDB from "@/lib/mongooseDB";
import Event from "@/models/Event";
import TicketOwnership from "@/models/TicketOwnership";

export async function POST(request) {
  const { ticketId, userId, eventId } = await request.json();
  try {
    await connectDB();

    const event = await Event.findById(eventId);
    if (!event) {
      return new Response(JSON.stringify({ error: "Event not found" }), { status: 404 });
    }

    const ticket = event.tickets.id(ticketId);
    if (!ticket || ticket.status !== "Available") {
      return new Response(JSON.stringify({ error: "Ticket not available" }), { status: 400 });
    }

    // Update ticket status
    ticket.status = "Sold";
    await event.save();

    // Create ticket ownership
    await TicketOwnership.create({
      userID: userId,
      eventID: eventId,
      ticket: ticketId,
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
