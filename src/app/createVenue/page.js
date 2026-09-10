"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/context/UserContext";

const inputClass =
  "w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800";

function Page() {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    capacity: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    const { error } = await createClient().from("venues").insert({
      name: formData.name,
      address: formData.address,
      capacity: Number(formData.capacity),
      created_by: user.id,
    });
    if (error) {
      setError(error.message);
      setIsSubmitting(false);
      return;
    }
    router.push("/createEvent");
  };

  const handleFormDataChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  if (isUserLoading) {
    return <p className="p-8 text-gray-600">Loading…</p>;
  }

  if (user?.role !== "organizer") {
    return (
      <div className="max-w-lg mx-auto my-10 bg-white p-8 rounded-lg shadow-md text-gray-800 space-y-4">
        <h2 className="text-2xl font-semibold">Only organizers can add venues</h2>
        <Link href="/organizers" className="underline">
          Become an organizer
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto my-10 bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
        Add Venue
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 font-medium mb-1" htmlFor="name">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleFormDataChange}
            required
            className={inputClass}
            placeholder="Enter Venue Name"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1" htmlFor="address">
            Address
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleFormDataChange}
            required
            className={inputClass}
            placeholder="Enter Venue Address"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1" htmlFor="capacity">
            Total Seats (up to 1,000)
          </label>
          <input
            type="number"
            min="1"
            max="1000"
            id="capacity"
            name="capacity"
            value={formData.capacity}
            onChange={handleFormDataChange}
            required
            className={inputClass}
            placeholder="Enter Total Seats"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-black text-white font-semibold py-2 px-4 rounded-md hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
        >
          {isSubmitting ? "Saving…" : "Add Venue"}
        </button>
      </form>

      <p className="py-2 text-black">Want to create an event now?</p>
      <Link href="/createEvent">
        <p className="text-black underline">Add Event</p>
      </Link>
    </div>
  );
}

export default Page;
