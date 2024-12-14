"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/router";

export default function VenueTesting() {
  const [organizerId, setOrgId] = useState("");
  const [venueID, setVenueId] = useState("");
  const [venueName, setVenueName] = useState("");
  const [address, setAddress] = useState("");
  const [eventName, setEventName] = useState("");
  const [seats, setSeats] = useState([]);
  // const [eventDate, setDate] = useState(eventData?.eventDate || ""); // havent used it yet
  const [tickets, setTickets] = useState([]);
  const [jsonData, setJsonData] = useState(null);

  const router = useRouter();

  // Add a new seat to the seats array
  const addTicket = () => {
    setTickets([
      ...tickets,
      {
        seat: { seatNumber: "", row: "", section: "" },
        price: "",
        status: "Available",
      },
    ]);
  };

  // Update a specific seat in the seats array
  const updateTicket = (index, field, value) => {
    const updatedTickets = tickets.map((ticket, i) =>
      i === index ? { ...ticket, [field]: value } : ticket
    );
    setTickets(updatedTickets);
  };

  // Remove a specific seat from the seats array
  const removeTicket = (index) => {
    setTickets(tickets.filter((_, i) => i !== index));
  };

  const postEventRequest = async (e) => {
    e.preventDefault();
    const payload = {
      eventName: eventName,
      organizerId: organizerId,
      venue: venueID,
      tickets,
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

  const postVenueRequest = async (e) => {
    e.preventDefault();
    try {
      const payload = { name: venueName, address: address, seats };
      const response = await fetch("/api/venues/create/venue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        alert("Venue saved successfully!");
      } else {
        alert("Error saving venue");
      }
    } catch (e) {
      console.log(e.error);
    }
  };

  return (
    <>
      <Navbar router={router} />
      <div className="max-w-lg mx-auto mt-10 bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
          Add a Venue
        </h2>
        <form onSubmit={postVenueRequest} className="space-y-4">
          <div>
            <label
              className="block text-gray-700 font-medium mb-1"
              htmlFor="venueName"
            >
              Venue Name
            </label>
            <input
              type="text"
              id="venueName"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-400"
              placeholder="Enter the venue name"
            />
          </div>
          <div>
            <label
              className="block text-gray-700 font-medium mb-1"
              htmlFor="address"
            >
              Address
            </label>
            <input
              type="text"
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-400"
              placeholder="Enter the venue address"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add Venue
          </button>
        </form>
      </div>

      <div className="max-w-lg mx-auto mt-10 bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
          Add Event
        </h2>
        <form onSubmit={postEventRequest} className="space-y-4">
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
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter event name"
            />
          </div>
          <div>
            <label
              className="block text-gray-700 font-medium mb-1"
              htmlFor="organizerId"
            >
              Organizer ID
            </label>
            <input
              type="text"
              id="organizerId"
              value={organizerId}
              onChange={(e) => setOrgId(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter organizer ID"
            />
          </div>
          <div>
            <label
              className="block text-gray-700 font-medium mb-1"
              htmlFor="venueId"
            >
              Venue ID
            </label>
            <input
              type="text"
              id="venueId"
              value={venueID}
              onChange={(e) => setVenueId(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter venue ID"
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
