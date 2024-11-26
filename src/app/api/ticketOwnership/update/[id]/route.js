import connectDB from "@/lib/mongooseDB";
import TicketOwnership from "@/models/TicketOwnership";
import User from "@/models/Users";

export async function PATCH(request, { params }) {
  const { id } = await params;
  const data = await request.json();

  if (!data.userEmail) {
    return new Response(
      JSON.stringify({ error: "ID and userId are required" }),
      { status: 400 }
    );
  }
  try {
    await connectDB();
    const transferUserId = await User.findOne({email: data.userEmail})
    console.log(transferUserId._id.toString())

    // Find the ownership record and update the userID
    const updatedRecord = await TicketOwnership.findByIdAndUpdate(
      id,
      { userID: transferUserId._id.toString() }, // Update the userID field
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
