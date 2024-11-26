
import connectDB from '@/lib/mongooseDB';
import User from '@/models/Users';

export async function GET(request, {params}) {
  try {

    const { id } = await params;

    await connectDB();

    const user = await User.findById( id);
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }
    return new Response(JSON.stringify(user), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
