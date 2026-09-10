"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/context/UserContext";
import VenueListModal from "@/components/Modals/venueListModal";

const CATEGORIES = ["music", "sports", "comedy", "theater"];
const inputClass =
  "w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800";

export default function CreateEvent() {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const [formData, setFormData] = useState({
    eventName: "",
    eventArtist: "",
    eventCategory: "music",
    ticketPrice: "",
    eventDate: "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [venueList, setVenueList] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openModal = async () => {
    const { data, error } = await createClient()
      .from("venues")
      .select("id, name, address, capacity")
      .order("name");
    if (error) {
      setError("Couldn't load venues. Please try again.");
      return;
    }
    setVenueList(data);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVenue) {
      setError("Choose a venue for your event.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    // create_event also creates one ticket per seat at this price.
    const { data: eventId, error } = await createClient().rpc("create_event", {
      p_name: formData.eventName,
      p_artist: formData.eventArtist,
      p_category: formData.eventCategory,
      // datetime-local has no timezone; the browser treats it as local time.
      p_starts_at: new Date(formData.eventDate).toISOString(),
      p_venue_id: selectedVenue.id,
      p_price_cents: Math.round(Number(formData.ticketPrice) * 100),
    });
    if (error) {
      setError(error.message);
      setIsSubmitting(false);
      return;
    }
    router.push(`/event/${eventId}`);
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
        <h2 className="text-2xl font-semibold">Only organizers can create events</h2>
        <Link href="/organizers" className="underline">
          Become an organizer
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-lg mx-auto my-10 bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
          Add Event
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1" htmlFor="eventName">
              Event Name
            </label>
            <input
              type="text"
              id="eventName"
              name="eventName"
              value={formData.eventName}
              onChange={handleFormDataChange}
              required
              className={inputClass}
              placeholder="Enter Event name"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1" htmlFor="eventArtist">
              Artist / Performer
            </label>
            <input
              type="text"
              id="eventArtist"
              name="eventArtist"
              value={formData.eventArtist}
              onChange={handleFormDataChange}
              className={inputClass}
              placeholder="Enter Artist Name"
            />
          </div>

          <p className="text-gray-700">Choose a Category for your event:</p>
          <div className="flex flex-col space-y-2">
            {CATEGORIES.map((category) => (
              <label key={category} className="flex items-center text-gray-700 capitalize">
                <input
                  type="radio"
                  name="eventCategory"
                  value={category}
                  checked={formData.eventCategory === category}
                  onChange={handleFormDataChange}
                  className="mr-2"
                />
                {category}
              </label>
            ))}
          </div>

          <button
            type="button"
            onClick={openModal}
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
          >
            {selectedVenue ? "Change venue" : "Click to select a Venue"}
          </button>
          {selectedVenue && (
            <p className="mt-2 text-sm text-gray-600">
              Selected Venue: <span className="font-medium">{selectedVenue.name}</span> (
              {selectedVenue.capacity} seats)
            </p>
          )}

          <div>
            <label className="block text-gray-700 font-medium mb-1" htmlFor="ticketPrice">
              Ticket Price (USD)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              id="ticketPrice"
              name="ticketPrice"
              value={formData.ticketPrice}
              onChange={handleFormDataChange}
              required
              className={inputClass}
              placeholder="Enter Ticket Price"
            />
          </div>
          <div>
            <label htmlFor="date-input" className="block text-gray-700 font-medium mb-1">
              Date and time
            </label>
            <input
              id="date-input"
              type="datetime-local"
              name="eventDate"
              value={formData.eventDate}
              onChange={handleFormDataChange}
              required
              className={inputClass}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-black text-white font-semibold py-2 px-4 rounded-md hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
          >
            {isSubmitting ? "Creating…" : "Add Event"}
          </button>
        </form>

        <p className="py-2 text-black">Couldn&apos;t find your desired venue in the list?</p>
        <Link href="/createVenue">
          <p className="text-black underline">Add Venue</p>
        </Link>
      </div>

      {isModalOpen && (
        <VenueListModal
          venueList={venueList}
          onSelect={setSelectedVenue}
          closeModal={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
