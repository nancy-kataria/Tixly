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
    let url = `/api/events/get/eventList`;
    if (query) {
      url = `/api/events/get/eventList?eventName=${query}`;
    }
    const res = await fetch(url);
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
        className="min-h-screen bg-gray-100 text-gray-800"
      >
        <h2 className="text-4xl font-bold text-gray-800 mb-4">
          Welcome to Tixly!
        </h2>
        <p>Shop Hundreds Of Live Events And Discover Can&apos;t-Miss Concerts, Games, Theater And More.</p>
        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search for events..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="rounded"
          style={{ padding: "0.5rem", width: "60%", margin: "1.5rem 1rem" }}
        />
        <button onClick={handleSearch} className="bg-black text-white rounded" style={{ padding: "0.5rem 1rem" }}>
          Search
        </button>
        {/* Display search results */}
        <EventList eventList={eventList}></EventList>
      </div>
    </>
  );
}
