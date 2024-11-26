"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EventList from "@/components/EventList";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [eventList, setEventList] = useState([]);

  const handleSearch = async () => {
    const res = await fetch(
      `/api/events/search?query=${encodeURIComponent(query)}`
    );
    const data = await res.json();
    setEventList(data);
  };

  useEffect(() => {
    const getRequest = async () => {
      try {
        const url = `/api/events/get/eventList`;
        const res = await fetch(url, { method: `GET` });
        const data = await res.json();
        if (res.ok) {
          setEventList(data);
        } else setEventList([]);
      } catch (e) {
        console.error(e);
      }
    };

    getRequest();
  }, []);

  return (
    <>
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
        <EventList eventList={eventList}></EventList>
      </div>
    </>
  );
}
