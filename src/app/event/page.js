import Image from "next/image";
import concert from "../../../public/concert.jpg"
import Navbar from "@/components/Navbar";

// pages/EventPage.js
export default function EventPage() {
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
          <h1 className="text-3xl font-bold text-gray-800">Event Name</h1>
          <p className="text-gray-600 mt-2">
            <span className="font-semibold">📍 Venue:</span> Yankee Stadium
          </p>
          <p className="text-gray-600 mt-1">
            <span className="font-semibold">📌 Address:</span> New York
          </p>
          <p className="text-gray-600 mt-1">
            <span className="font-semibold">🎫 Total Tickets Available:</span> 33
          </p>
        </div>
      </div>
      </>
    );
  }
  