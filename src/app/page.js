'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import concert from '../../public/concert.jpg'
import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    const res = await fetch(`/api/events/search?query=${encodeURIComponent(query)}`);
    const data = await res.json();
    setResults(data);
  };

  return (
    <>
    <Navbar />
    <div style={{ padding: '2rem', textAlign: 'center' }} className='min-h-screen bg-gray-100'>
     
      <h1>Welcome to Event Finder</h1>

      {/* Search Bar */}
      {/* <input
        type="text"
        placeholder="Search for events..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ padding: '0.5rem', width: '60%', marginRight: '0.5rem' }}
      />
      <button onClick={handleSearch} style={{ padding: '0.5rem 1rem' }}>
        Search
      </button> */}

      {/* Display search results */}
      <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
        {results.map((event) => (
          <div key={event._id} className="w-full max-w-lg p-6 bg-white border border-gray-300 rounded-lg shadow-md">
          {/* Event Name */}
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{event.name}</h2>
          
          {/* Date and Venue */}
          <div className="text-gray-600">
            <p className="text-sm font-medium mb-1">📅 Date: ({new Date(event.date).toLocaleDateString()})</p>
            <p className="text-sm font-medium">📍 Venue: {event.location}</p>
          </div>
        </div>
        ))}
      </ul>

    <Link href="/event">
    <div className="w-full max-w-lg p-4 bg-white border border-gray-300 rounded-lg shadow-md flex items-center space-x-4">
      {/* Event Image */}
      <Image
        src={concert}
        alt="concert-image"
        className="w-24 h-24 rounded-lg object-cover"
      />

      {/* Event Details */}
      <div>
        {/* Event Name */}
        <h2 className="text-2xl font-bold text-gray-800">Event Name</h2>

        {/* Date and Venue */}
        <div className="text-gray-600 mt-2">
          <p className="text-sm font-medium">📅 Date: 01-01-2025</p>
          <p className="text-sm font-medium">📍 Venue: New York</p>
        </div>
      </div>
    </div>
    </Link>
    </div>
    </>
  );
}
