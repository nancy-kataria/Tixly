import connectDB from "@/lib/mongooseDB";
import TicketOwnership from "@/models/TicketOwnership";

export async function GET({params}) {
  const { id } = await params;
  console.log(id)

  if (!id) {
    return new Response(
      JSON.stringify({ error: "ID is required" }),
      { status: 400 }
    );
  }

  try {
    await connectDB();
    const ticketList = await TicketOwnership.find({ userID: id });

    return new Response(JSON.stringify({ data: ticketList }), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
