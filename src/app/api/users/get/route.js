import connectDB from '@/lib/mongooseDB';
import User from '@/models/Users';

export async function GET(req, res) {
  try {
    await connectDB(); // Ensure DB connection is established

    // Fetch users with userType 'Organizer'
    const users = await User.find({ userType: 'Organizer' });

    // Return the users in the response
    return new Response(JSON.stringify(users), { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
