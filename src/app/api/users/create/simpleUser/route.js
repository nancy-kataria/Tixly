//Only required fields
import connectDB from '@/lib/mongooseDB';
import User from '@/models/Users';

export async function POST(request) {
    console.log("User Sign Up Post Request Called");
  await connectDB();
  const data = await request.json();
 // const { name, email, password, userType } = await request.json();


  //const newUser = new User({name,email, password,userType});
  const newUser = new User(data);
  
  try {
    console.log("hello");
    await newUser.save();
    return new Response(JSON.stringify({ message: 'User created successfully' }), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'User already exists or invalid data' }), { status: 400 });
  }
}
