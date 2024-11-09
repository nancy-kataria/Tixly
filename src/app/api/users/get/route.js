import connectDB from '@/lib/mongooseDB';
import User from '@/models/Users';

export default async function GET(req, res) {
    try {
      // Ensure the connection to DB is established
      await connectDB();
  
      // Query the database for users with userType 'Organizer'
      if (req.method === 'GET') {
        const users = await User.find({ userType: 'Organizer' });
        console.log(users)
  
        return res.status(200).json(users);
      }
  
      // Handle other methods (optional)
      res.status(405).json({ message: 'Method Not Allowed' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }