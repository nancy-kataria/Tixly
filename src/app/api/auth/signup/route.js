import connectDB from '@/lib/mongooseDB';
import User from '@/models/Users';

export async function POST(req, res) {
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
    await createUserCookie(user, res);
    return new Response(JSON.stringify(user), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'User already exists or invalid data' }), { status: 400 });
  }
}
