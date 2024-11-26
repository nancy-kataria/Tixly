"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/compat/router";

export default function CreateEvent() {
  const [eventName, setEventName] = useState("");
  const [venueID, setVenueId] = useState("");
  const [ticketPrice, setTicketPrice] = useState("");
  const router = useRouter();
  const { user } = useAuth();

  const handleSubmit = async () => {
    const payload = {
      eventName: eventName,
      organizerId: user._id,
      venue: venueID,
      ticketPrice,
    };
    const response = await fetch("/api/events/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (response.ok) {
      alert("Event saved successfully!");
    } else {
      alert("Error saving Event");
    }
  };

  return (
    <>
      <Navbar router={router} />

      <div className="max-w-lg mx-auto mt-10 bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
          Add Event
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-gray-700 font-medium mb-1"
              htmlFor="eventName"
            >
              Event Name
            </label>
            <input
              type="text"
              id="eventName"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-400"
              placeholder="Enter event name"
            />
          </div>

          <div>
            <label
              className="block text-gray-700 font-medium mb-1"
              htmlFor="venueId"
            >
              {" "}
              Venue ID{" "}
            </label>
            <input
              type="text"
              id="venueId"
              value={venueID}
              onChange={(e) => setVenueId(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-400"
              placeholder="Enter venue ID"
            />
          </div>
          <div>
            <label
              className="block text-gray-700 font-medium mb-1"
              htmlFor="ticketPrice"
            >
              {" "}
              Ticket Price{" "}
            </label>
            <input
              type="text"
              id="ticketPrice"
              value={ticketPrice}
              onChange={(e) => setTicketPrice(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-400"
              placeholder="Enter Ticket Price"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add Event
          </button>
        </form>
      </div>
    </>
  );
}
