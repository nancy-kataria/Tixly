import connectDB from '@/lib/mongooseDB';
import User from '@/models/Users';

export async function POST(request) {
  await connectDB();
  const { email, password } = await request.json();

  const user = await User.findOne({ email });
  if (!user || (password != user.password)) {
    return new Response(JSON.stringify({ error: 'Invalid email or password' }), { status: 401 });
  }
  // Authentication successful
  return new Response(JSON.stringify(user), { status: 200 });
}
