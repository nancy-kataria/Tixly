"use client";

import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import concert from "../../../public/concert.jpg";
// import { useRouter } from "next/router";
// This is the same useRouter hook, but can be used in both
// app and pages directories.
// It differs from next/router in that it does not throw an
// error when the pages router is not mounted, and instead has a
// return type of NextRouter | null. This allows developers to
// convert components to support running in both app and pages as they transition to the app router.
import { useRouter } from "next/compat/router";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

export default function MyProfile() {
  const router = useRouter();
  const { user } = useAuth();
  const [eventList, setEventList] = useState([]);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (router && !router.isReady) {
      return;
    }
    const id = searchParams.get("userId");
    const getEventsOwnedbyOrganizer = async () => {
      try {
        const response = await fetch(`/api/events/get/organizerID/${id}`, {
          method: "GET",
        });
        const data = await response.json();
        setEventList(data);
      } catch (error) {
        console.error(error);
      }
    };

    getEventsOwnedbyOrganizer();
  }, []);

  console.log(user);
  console.log(eventList);
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar router={router} />
      <div className="text-gray-800">
        <h3 className="text-2xl font-bold">{user.userType}</h3>
        <p className="text-lg font-medium">{user.name}</p>
        <h3 className="text-2xl font-bold">Your Event List</h3>
        {eventList.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {eventList.map((event) => (
              <div
                key={event._id}
                onClick={() => {
                  router.push(`/event/${event._id}`);
                }}
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
                      📅 Date: ({new Date(event.eventDate).toLocaleDateString()}
                      )
                    </p>
                    <p className="text-sm font-medium">
                      📍 Venue: {event.venue}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm font-medium">No events yet</p>
        )}
      </div>
    </div>
  );
}
