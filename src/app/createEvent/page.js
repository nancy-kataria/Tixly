"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/context/UserContext";
import VenueListModal from "@/components/Modals/venueListModal";
import Card from "@/components/ui/Card";
import Eyebrow from "@/components/ui/Eyebrow";
import Button, { buttonClasses } from "@/components/ui/Button";
import Input, { Label } from "@/components/ui/Input";

const CATEGORIES = ["music", "sports", "comedy", "theater"];

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
    return <p className="px-6 py-16 text-center text-muted-foreground">Loading…</p>;
  }

  if (user?.role !== "organizer") {
    return (
      <div className="mx-auto max-w-lg px-6 py-16">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-medium tracking-tight">Only organizers can create events</h1>
          <Link href="/organizers" className={buttonClasses({ className: "mt-6" })}>
            Become an organizer
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Card className="p-8 sm:p-10">
        <Eyebrow>Organizer</Eyebrow>
        <h1 className="mt-1 text-4xl font-medium tracking-tight">Create an event</h1>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <Label htmlFor="eventName">Event name</Label>
            <Input
              id="eventName"
              name="eventName"
              value={formData.eventName}
              onChange={handleFormDataChange}
              required
              placeholder="Neon Tides: Summer's End Tour"
            />
          </div>

          <div>
            <Label htmlFor="eventArtist">Artist or performer</Label>
            <Input
              id="eventArtist"
              name="eventArtist"
              value={formData.eventArtist}
              onChange={handleFormDataChange}
              placeholder="Optional"
            />
          </div>

          <fieldset>
            <legend className="mb-1.5 text-sm font-medium">Category</legend>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <label
                  key={category}
                  className="cursor-pointer rounded-full border border-surface-border bg-surface-strong px-4 py-1.5 text-sm capitalize transition hover:bg-white has-[:checked]:border-transparent has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
                >
                  <input
                    type="radio"
                    name="eventCategory"
                    value={category}
                    checked={formData.eventCategory === category}
                    onChange={handleFormDataChange}
                    className="sr-only"
                  />
                  {category}
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <p className="mb-1.5 text-sm font-medium">Venue</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" onClick={openModal}>
                {selectedVenue ? "Change venue" : "Choose a venue"}
              </Button>
              {selectedVenue && (
                <span className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{selectedVenue.name}</span> ·{" "}
                  {selectedVenue.capacity} seats
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Can&apos;t find your venue?{" "}
              <Link href="/createVenue" className="font-medium text-primary-text hover:underline">
                Add a venue
              </Link>
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <Label htmlFor="ticketPrice">Ticket price (USD)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                id="ticketPrice"
                name="ticketPrice"
                value={formData.ticketPrice}
                onChange={handleFormDataChange}
                required
                placeholder="45"
              />
            </div>
            <div>
              <Label htmlFor="date-input">Date and time</Label>
              <Input
                id="date-input"
                type="datetime-local"
                name="eventDate"
                value={formData.eventDate}
                onChange={handleFormDataChange}
                required
              />
            </div>
          </div>

          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

          <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Creating…" : "Create event"}
          </Button>
        </form>
      </Card>

      {isModalOpen && (
        <VenueListModal
          venueList={venueList}
          onSelect={setSelectedVenue}
          closeModal={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
