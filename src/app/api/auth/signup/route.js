import connectDB from '@/lib/mongooseDB';
import User from '@/models/Users';

export async function POST(request) {
    console.log("Hello");
  await connectDB();
  const { name, email, password, userType } = await request.json();


  const newUser = new User({
    name,
    email,
    password,
    userType
  });
  
  try {
    console.log("hello");
    await newUser.save();
    return new Response(JSON.stringify({ message: 'User created successfully' }), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'User already exists or invalid data' }), { status: 400 });
  }
}
