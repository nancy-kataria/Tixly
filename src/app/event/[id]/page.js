// To use react hooks
"use client";

import Image from "next/image";
import concert from "../../../../public/concert.jpg";
import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";

// pages/EventPage.js
export default function EventPage({ params }) {
  const [event, setEvent] = useState({});

  useEffect(() => {
    const getRequest = async () => {
      const eventId = (await params).id;

      try {
        const url = `/api/events/get/eventID/${eventId}`;
        const res = await fetch(url, { method: `GET` });
        const data = await res.json();
        if (res.ok) {
          setEvent(data);
        } else setEvent({});
      } catch (e) {
        console.error(e);
      }
    };

    getRequest();
  }, [params]);

  console.log(event);

  return (
    <>
      <Navbar />
      <div className="flex flex-col items-center min-h-screen bg-gray-100 p-8">
        {/* Event Image */}
        <div className="w-full max-w-2xl">
          <Image
            src={concert}
            alt="concert-image"
            className="w-30 h-30 rounded-lg object-cover"
          />
        </div>

        {/* Event Details */}
        <div className="w-full max-w-2xl bg-white mt-6 p-6 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold text-gray-800">
            {event.eventName}
          </h1>
          <p className="text-gray-600 mt-2">
            <span className="font-semibold">📍 Venue:</span>{" "}
            {event?.venue?.name}
          </p>
          <p className="text-gray-600 mt-1">
            <span className="font-semibold">📌 Address:</span>{" "}
            {event?.venue?.address}
          </p>
          <p className="text-gray-600 mt-1">
            <span className="font-semibold">🎫 Total Tickets Available:</span>{" "}
            164
          </p>
          <p className="text-gray-600 mt-1">
            <span className="font-semibold">📅 Date:</span> 12/06/2024
          </p>
        </div>
      </div>
    </>
  );
}
