import connectDB from "@/lib/mongooseDB";
import TicketOwnership from "@/models/TicketOwnership";

export async function PATCH(request, { params }) {
  const { id } = await params;
  const data = await request.json();

  if (!data.userId) {
    return new Response(
      JSON.stringify({ error: "ID and userId are required" }),
      { status: 400 }
    );
  }
  try {
    await connectDB();
    // Find the ownership record and update the userID
    const updatedRecord = await TicketOwnership.findByIdAndUpdate(
      id,
      { userID: data.userId }, // Update the userID field
      { new: true, runValidators: true } // Return the updated document
    );

    if (!updatedRecord) {
      return new Response(JSON.stringify({ error: "Record not found" }), {
        status: 404,
      });
    }
    return new Response(JSON.stringify({ data: updatedRecord }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
