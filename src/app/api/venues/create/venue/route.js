// /app/api/venues/route.js
import Venue from '@/models/Venue';

export async function POST(request) {
  const data = await request.json();
  try {
    const newVenue = await Venue.create(data);
    
    return new Response(JSON.stringify(newVenue), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
