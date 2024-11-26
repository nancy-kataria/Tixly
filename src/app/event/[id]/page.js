// To use react hooks
"use client";

import Image from "next/image";
import concert from "../../../../public/concert.jpg";
import { useEffect, useState } from "react";
import TicketList from "@/components/tickets/TicketList";
import { useRouter } from "next/compat/router";

// pages/EventPage.js
export default function EventPage({ params }) {
  const [event, setEvent] = useState({});
  const[sortBy, setSortBy] = useState("status");
  const [sortedTickets, setSortedTickets] = useState([]);
  const router = useRouter();

  const [promptInput, setPromptInput] = useState("");
  const [response, setResponse] = useState("");
  const [boxOpen, setBoxOpen] = useState(false);
  const userID = "672fbdfa8f244694a34a5309";

  const getGenAIresponse = async () => {
    try {
      const res = await fetch("/api/genAI", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptInput }),
      });

      const data = await res.json();
      setResponse(data.choices[0].message.content);
    } catch (error) {
      console.error("Error:", error);
      setResponse("Error fetching response");
    }

    setBoxOpen(true);
  };

  useEffect(() => {
    const getRequest = async () => {
      const eventId = (await params).id;

      try {
        const url = `/api/events/get/eventID/${eventId}`;
        const res = await fetch(url, { method: `GET` });
        const data = await res.json();
        if (res.ok) {
          setEvent(data);
          //sort ticket list
          setSortedTickets([...data.tickets]);//.sort((a,b)=>a[sortBy].localCompare(b[sortBy])));

          if (data?.eventArtist) {
            setPromptInput(`Tell me something about ${data?.eventArtist}`);
          }
        } else setEvent({});
      } catch (e) {
        console.error(e);
      }
    };

    getRequest();
  }, [params, sortBy]);

  const date = new Date(event?.eventDate);

  return (
    <>
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
            {event?.eventName}
          </h1>
          <h1 className="text-xl font-bold text-gray-800">
            {event?.eventArtist}
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
            {event?.venue?.totalSeats}
          </p>
          <p className="text-gray-600 mt-1">
            <span className="font-semibold">📅 Date:</span>{" "}
            {date?.toLocaleDateString("en-US")}
          </p>
        </div>

    {event.tickets && Array.isArray(event.tickets) ? 
        (<TicketList tickets={event.tickets} eventID={event._id} userID={userID} />) :
        (<p>Loading Tickets</p>)
        }

        <div className="text-center">
          {!boxOpen ? (
            <button
              onClick={getGenAIresponse}
              className="px-4 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 focus:outline-none"
            >
              Click to know more about the artist
            </button>
          ) : (
            <div className="mt-4 max-w-sm mx-auto p-6 bg-blue-100 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-blue-900 mb-2">
                Do you know..
              </h2>
              <p className="text-gray-700">{response}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
