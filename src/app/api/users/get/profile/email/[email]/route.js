
import connectDB from '@/lib/mongooseDB';
import User from '@/models/Users';

// Get user details by email

export async function GET(request, {params}) {
  try {

    const { email } = await params;

    await connectDB();

    const user = await User.findOne({ email: email });
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }
    return new Response(JSON.stringify(user), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
