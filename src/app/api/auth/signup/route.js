import connectDB from '@/lib/mongooseDB';
import User from '@/models/Users';

export async function POST(request) {
  await connectDB();
  const { name, email, password, userType } = await request.json();


  const user = new User({
    name,
    email,
    password,
    userType
  });
  
  try {
    await user.save();
    return new Response(user, { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'User already exists or invalid data' }), { status: 400 });
  }
}
