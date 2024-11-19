"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Navbar from "@/components/Navbar";
import concert from "../../public/concert.jpg";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    const res = await fetch(
      `/api/events/search?query=${encodeURIComponent(query)}`
    );
    const data = await res.json();
    setResults(data);
  };

  useEffect(() => {
    const getRequest = async () => {
      try {
        const url = `/api/events/get/eventList`;
        const res = await fetch(url, { method: `GET` });
        const data = await res.json();
        if (res.ok) {
          setResults(data);
        } else setResults([]);
      } catch (e) {
        console.error(e);
      }
    };

    getRequest();
  }, []);

  return (
    <>
      <Navbar />
      <div
        style={{ padding: "2rem", textAlign: "center" }}
        className="min-h-screen bg-gray-100"
      >
        <h2 className="text-4xl font-bold text-gray-800 mb-8">Welcome to Event Search</h2>

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
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {results.map((event) => (
            <div
              key={event._id}
              onClick={()=>{router.push(`/event/${event._id}`)}}
              className="w-full max-w-lg p-4 bg-white border border-gray-300 rounded-lg shadow-md flex items-center space-x-4"
            >
              {/* Event Image */}
              <Image
                src={concert}
                alt="concert-image"
                className="w-24 h-24 rounded-lg object-cover"
              />

              {/* Event Details */}
              <div>
                {/* Event Name */}
                <h2 className="text-2xl font-bold text-gray-800">
                  {event.eventName}
                </h2>

                {/* Date and Venue */}
                <div className="text-gray-600 mt-2">
                  <p className="text-sm font-medium">
                    📅 Date: ({new Date(event.eventDate).toLocaleDateString()})
                  </p>
                  <p className="text-sm font-medium">📍 Venue: {event.venue}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
