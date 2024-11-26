
import connectDB from '@/lib/mongooseDB';
import User from '@/models/Users';

export async function PUT(request, {params}) {
  try {

    const { id } = await params;
    const payload = await request.json();
    const { name, email, password, userType } = payload;

    await connectDB();

    const user = await User.findByIdAndUpdate(id, {name, email, password, userType}, {new:true});
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }
    return new Response(JSON.stringify(user), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
