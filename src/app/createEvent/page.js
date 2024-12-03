"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/compat/router";

export default function CreateEvent() {
  const [formData, setFormData] = useState({
    eventName: "",
    venue: "",
    ticketPrice: "",
    eventDate: "",
    eventArtist: "",
    eventCategory: "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = async () => {
    const payload = {
      ...formData,
      organizerId: user._id,
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

  const handleFormDataChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  return (
    <>
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
              name="eventName"
              value={formData.eventName}
              onChange={handleFormDataChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-400"
              placeholder="Enter event name"
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
              name="venue"
              value={formData.venue}
              onChange={handleFormDataChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-400"
              placeholder="Enter venue ID"
            />
          </div>
          <button
            onClick={openModal}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Open Modal
          </button>
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
            className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add Event
          </button>
        </form>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <h2 className="text-xl font-semibold mb-4">Modal Title</h2>
            <p className="mb-4">
              This is a modal content example. You can put anything here!
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert("Action executed!");
                  closeModal();
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
