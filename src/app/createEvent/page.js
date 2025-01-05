"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/compat/router";
import { useUser } from "@/context/UserContext";
import VenueListModal from "@/components/Modals/venueListModal";
import Link from "next/link";

export default function CreateEvent() {
  const { user, isLoading: isUserLoading } = useUser();
  const [formData, setFormData] = useState({
    eventName: "",
    venue: "",
    ticketPrice: "",
    eventDate: "",
    eventArtist: "",
    eventCategory: "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [venueList, setVenueList] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState({});
  const router = useRouter();

  const openModal = () => {
    getVenueList();
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = async () => {
    const payload = {
      ...formData,
      organizerId: user.id,
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

  const getVenueList = async () => {
    const res = await fetch("/api/venues/get/venueList", {
      method: "GET",
    });

    if (res.ok) {
      const data = await res.json();
      setVenueList(data);
    }
  };

  const handleFormDataChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  return (
    <>
      <div className="max-w-lg mx-auto my-10 bg-white p-8 rounded-lg shadow-md">
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
              name="eventName"
              value={formData.eventName}
              onChange={handleFormDataChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-400"
              placeholder="Enter Event name"
            />
          </div>

          <div>
            <label
              className="block text-gray-700 font-medium mb-1"
              htmlFor="eventArtist"
            >
              Artist Name
            </label>
            <input
              type="text"
              id="eventArtist"
              name="eventArtist"
              value={formData.eventArtist}
              onChange={handleFormDataChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-400"
              placeholder="Enter Artist Name"
            />
          </div>

          <p className="text-gray-700">Choose a Category for your event:</p>
          <div className="flex flex-col space-y-2">
            <label className="flex items-center text-gray-700">
              <input
                type="radio"
                name="eventCategory"
                value="Music"
                checked={formData.eventCategory === "Music"}
                onChange={handleFormDataChange}
                className="mr-2"
              />
              Music
            </label>
            <label className="flex items-center text-gray-700">
              <input
                type="radio"
                name="eventCategory"
                value="Sports"
                checked={formData.eventCategory === "Sports"}
                onChange={handleFormDataChange}
                className="mr-2"
              />
              Sports
            </label>
            <label className="flex items-center text-gray-700">
              <input
                type="radio"
                name="eventCategory"
                value="Comedy"
                checked={formData.eventCategory === "Comedy"}
                onChange={handleFormDataChange}
                className="mr-2"
              />
              Comedy
            </label>
            <label className="flex items-center text-gray-700">
              <input
                type="radio"
                name="eventCategory"
                value="Theater"
                checked={formData.eventCategory === "Theater"}
                onChange={handleFormDataChange}
                className="mr-2"
              />
              Theater
            </label>
          </div>
          {formData.eventCategory && (
            <p className="mt-4 text-green-600">
              You selected: {formData.eventCategory}
            </p>
          )}
          <button
            onClick={openModal}
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
          >
            Click to select a Venue
          </button>

          {formData.venue && (
            <p className="mt-2 text-sm text-gray-600">
              Selected Venue:{" "}
              <span className="font-medium">{selectedVenue.name}</span>
            </p>
          )}
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
              name="ticketPrice"
              value={formData.ticketPrice}
              onChange={handleFormDataChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-400"
              placeholder="Enter Ticket Price"
            />
          </div>
          <div>
            <label
              htmlFor="date-input"
              className="block text-gray-700 font-medium mb-1"
            >
              Select a Date:
            </label>
            <input
              id="date-input"
              type="date"
              name="eventDate"
              value={formData.eventDate}
              onChange={handleFormDataChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-400"
            />
            {formData.eventDate && (
              <p className="mt-2 text-sm text-gray-600">
                You selected:{" "}
                <span className="font-medium">{formData.eventDate}</span>
              </p>
            )}
          </div>
          <button
            type="submit"
            className="w-full bg-black text-white font-semibold py-2 px-4 rounded-md hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add Event
          </button>
        </form>

        <p className="py-2 text-black">
          Couldn&apos;t find your desired venue in the list?
        </p>
        <Link href="/createVenue">
          <p className="text-black underline">Add Venue</p>
        </Link>
      </div>

      {isModalOpen && (
        <VenueListModal
          venueList={venueList}
          setFormData={setFormData}
          formData={formData}
          closeModal={closeModal}
          setSelectedVenue={setSelectedVenue}
        />
      )}
    </>
  );
}
