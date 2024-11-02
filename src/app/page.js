'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

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
    <div style={{ padding: '2rem', textAlign: 'center' }}>
     
      <h1>Welcome to Event Finder</h1>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search for events..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ padding: '0.5rem', width: '60%', marginRight: '0.5rem' }}
      />
      <button onClick={handleSearch} style={{ padding: '0.5rem 1rem' }}>
        Search
      </button>

      {/* Display search results */}
      <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
        {results.map((event) => (
          <li key={event._id} style={{ margin: '0.5rem 0' }}>
            <strong>{event.name}</strong> - {event.location} ({new Date(event.date).toLocaleDateString()})
          </li>
        ))}
      </ul>

      {/* Login Button */}
      <button
        onClick={() => router.push('/login')}
        style={{ marginTop: '2rem', padding: '0.5rem 1rem', backgroundColor: '#0070f3', color: '#fff', border: 'none', cursor: 'pointer' }}
      >
        Login / Signup
      </button>
      <div></div>
      <button
        onClick={() => router.push('/testing')}
        style={{ marginTop: '2rem', padding: '0.5rem 1rem', backgroundColor: '#0070f3', color: '#fff', border: 'none', cursor: 'pointer' }}
      >
        Testing
      </button>
    </div>
    </>
  );
}
