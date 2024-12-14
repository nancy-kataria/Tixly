// To use react hooks
"use client";

import Image from "next/image";
import concert from "../../../../public/concert.jpg";
import { useEffect, useState } from "react";
import TicketList from "@/components/tickets/TicketList";
import { useRouter } from "next/compat/router";
import { useUser } from "@/context/UserContext";

// pages/EventPage.js
export default function EventPage({ params }) {
  const { user, isLoading: isUserLoading } = useUser();

  const [event, setEvent] = useState({});
  const [sortBy, setSortBy] = useState("status");
  const [sortedTickets, setSortedTickets] = useState([]);
  const router = useRouter();

  const [promptInput, setPromptInput] = useState("");
  const [response, setResponse] = useState("");
  const [boxOpen, setBoxOpen] = useState(false);

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
    //wait for the user context
    if (isUserLoading) return;

    const getRequest = async () => {
      const eventId = (await params).id;

      try {
        var url = `/api/events/get/eventID/${eventId}`;
        if (user && user.id) url += `?userID=${user.id}`;
        const res = await fetch(url, { method: `GET` });
        const data = await res.json();
        if (res.ok) {
          setEvent(data);
          //sort ticket list
          setSortedTickets([...data.tickets]); //.sort((a,b)=>a[sortBy].localCompare(b[sortBy])));

          if (data?.event?.eventArtist) {
            setPromptInput(
              `Tell me something about ${data?.event?.eventArtist}`
            );
          }
        } else setEvent({});
      } catch (e) {
        console.error(e);
      }
    };

    getRequest();
  }, [params, sortBy, user, isUserLoading]);

  const date = new Date(event?.event?.eventDate);
  return (
    <div>
      <div className="flex items-center bg-gray-100 p-8">
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
            {event?.event?.eventName}
          </h1>
          <h1 className="text-xl font-bold text-gray-800">
            {event?.event?.eventArtist}
          </h1>
          <p className="text-gray-600 mt-2">
            <span className="font-semibold">📍 Venue:</span>{" "}
            {event?.event?.venue?.name}
          </p>
          <p className="text-gray-600 mt-1">
            <span className="font-semibold">📌 Address:</span>{" "}
            {event?.event?.venue?.address}
          </p>
          <p className="text-gray-600 mt-1">
            <span className="font-semibold">🎫 Total Tickets Available:</span>{" "}
            {event?.event?.venue?.totalSeats}
          </p>
          <p className="text-gray-600 mt-1">
            <span className="font-semibold">📅 Date:</span>{" "}
            {date?.toLocaleDateString("en-US")}
          </p>
        </div>
      </div>
      <div className="flex space-x-8 min-h-screen bg-gray-100 p-8">
        <div className="flex-[0_0_70%]">
        {event.tickets && Array.isArray(event.tickets) ? (
          <TicketList ticketList={event.tickets} userID={user?.id} />
        ) : (
          <p>Loading Tickets</p>
        )}
        </div>

        <div className="flex-[0_0_30%] text-center">
          {!boxOpen ? (
            <button
              onClick={getGenAIresponse}
              className="px-4 py-2 bg-black text-white font-semibold rounded hover:bg-gray-800 focus:outline-none"
            >
              Click to know more
            </button>
          ) : (
            <div className="mt-4 max-w-sm mx-auto p-6 bg-gray-800 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-white-900 mb-2">
                Did you know..
              </h2>
              <p className="text-white-700">{response}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
