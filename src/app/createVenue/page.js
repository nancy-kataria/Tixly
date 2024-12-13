"use client";
import Link from "next/link";
import { useState } from "react";

function page() {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    totalSeats: "",
  });

  const handleSubmit = async () => {
    const payload = {
      ...formData,
    };
    const response = await fetch("/api/venues/create/venue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (response.ok) {
      alert("Venue saved successfully!");
    } else {
      alert("Error saving Venue");
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
    <div className="max-w-lg mx-auto mt-10 bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
        Add Venue
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            className="block text-gray-700 font-medium mb-1"
            htmlFor="name"
          >
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleFormDataChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-400"
            placeholder="Enter Venue Name"
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
            name="address"
            value={formData.address}
            onChange={handleFormDataChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-400"
            placeholder="Enter Venue Address"
          />
        </div>

        <div>
          <label
            className="block text-gray-700 font-medium mb-1"
            htmlFor="totalSeats"
          >
            {" "}
            Total Seats{" "}
          </label>
          <input
            type="number"
            id="totalSeats"
            name="totalSeats"
            value={formData.totalSeats}
            onChange={handleFormDataChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-400"
            placeholder="Enter Total Seats"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-black text-white font-semibold py-2 px-4 rounded-md hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Add Venue
        </button>
      </form>

      <p className="py-2 text-black">
          Want to create an event now?
        </p>
        <Link href="createEvent">
          <p className="text-black underline">Add Event</p>
        </Link>
    </div>
  );
}

export default page;
