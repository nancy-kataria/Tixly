"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/context/UserContext";
import VenueListModal from "@/components/Modals/venueListModal";
import Card from "@/components/ui/Card";
import Eyebrow from "@/components/ui/Eyebrow";
import Button, { buttonClasses } from "@/components/ui/Button";
import Input, { Label } from "@/components/ui/Input";
import { cn } from "@/lib/cn";

const CATEGORIES = ["music", "sports", "comedy", "theater"];
const MAX_SECTIONS = 10; // matches create_event() in the database

// Keys for section rows, so React can track rows as they're added and removed.
let nextSectionKey = 1;

export default function CreateEvent() {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const [formData, setFormData] = useState({
    eventName: "",
    eventArtist: "",
    eventCategory: "music",
    eventDate: "",
  });
  const [sections, setSections] = useState([
    { key: 0, name: "General admission", description: "", price: "", capacity: "" },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [venueList, setVenueList] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalTickets = sections.reduce((sum, section) => sum + (Number(section.capacity) || 0), 0);
  const isOverCapacity = Boolean(selectedVenue) && totalTickets > selectedVenue.capacity;

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

  const updateSection = (key, field, value) =>
    setSections((current) => current.map((s) => (s.key === key ? { ...s, [field]: value } : s)));

  const addSection = () => {
    const key = nextSectionKey++;
    setSections((current) => [...current, { key, name: "", description: "", price: "", capacity: "" }]);
  };

  const removeSection = (key) => setSections((current) => current.filter((s) => s.key !== key));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVenue) {
      setError("Choose a venue for your event.");
      return;
    }
    if (isOverCapacity) {
      setError(`Your sections add up to ${totalTickets} tickets, but ${selectedVenue.name} holds ${selectedVenue.capacity}.`);
      return;
    }
    setIsSubmitting(true);
    setError("");
    // create_event also creates one ticket per spot in each section.
    const { data: eventId, error } = await createClient().rpc("create_event", {
      p_name: formData.eventName,
      p_artist: formData.eventArtist,
      p_category: formData.eventCategory,
      // datetime-local has no timezone; the browser treats it as local time.
      p_starts_at: new Date(formData.eventDate).toISOString(),
      p_venue_id: selectedVenue.id,
      p_sections: sections.map((section) => ({
        name: section.name.trim(),
        description: section.description.trim(),
        price_cents: Math.round(Number(section.price) * 100),
        capacity: Number(section.capacity),
      })),
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

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-sm font-medium">Venue</p>
              <Button variant="outline" onClick={openModal} className="w-full">
                {selectedVenue ? selectedVenue.name : "Choose a venue"}
              </Button>
              <p className="mt-2 text-sm text-muted-foreground">
                {selectedVenue ? (
                  `Holds ${selectedVenue.capacity.toLocaleString("en-US")} people`
                ) : (
                  <>
                    Not listed?{" "}
                    <Link href="/createVenue" className="font-medium text-primary-text hover:underline">
                      Add a venue
                    </Link>
                  </>
                )}
              </p>
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

          <fieldset>
            <legend className="text-sm font-medium">Sections</legend>
            <p className="mt-1 text-sm text-muted-foreground">
              Split the venue into areas with their own price, like General, Premium and Front row.
            </p>

            <div className="mt-3 space-y-3">
              {sections.map((section, index) => (
                <div key={section.key} className="rounded-panel border border-surface-border bg-surface-strong p-4">
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_7rem_7rem]">
                    <div>
                      <Label htmlFor={`section-name-${section.key}`}>Name</Label>
                      <Input
                        id={`section-name-${section.key}`}
                        value={section.name}
                        onChange={(e) => updateSection(section.key, "name", e.target.value)}
                        required
                        placeholder="Premium"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`section-price-${section.key}`}>Price (USD)</Label>
                      <Input
                        id={`section-price-${section.key}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={section.price}
                        onChange={(e) => updateSection(section.key, "price", e.target.value)}
                        required
                        placeholder="85"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`section-capacity-${section.key}`}>Tickets</Label>
                      <Input
                        id={`section-capacity-${section.key}`}
                        type="number"
                        min="1"
                        step="1"
                        value={section.capacity}
                        onChange={(e) => updateSection(section.key, "capacity", e.target.value)}
                        required
                        placeholder="200"
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex items-end gap-3">
                    <div className="flex-1">
                      <Label htmlFor={`section-description-${section.key}`}>Description</Label>
                      <Input
                        id={`section-description-${section.key}`}
                        value={section.description}
                        onChange={(e) => updateSection(section.key, "description", e.target.value)}
                        placeholder="Optional, e.g. Reserved · center"
                      />
                    </div>
                    {sections.length > 1 && (
                      <Button
                        variant="ghost"
                        onClick={() => removeSection(section.key)}
                        aria-label={`Remove section ${index + 1}`}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <Button variant="outline" size="sm" onClick={addSection} disabled={sections.length >= MAX_SECTIONS}>
                <Plus className="size-4" aria-hidden /> Add section
              </Button>
              <p className={cn("text-sm", isOverCapacity ? "font-medium text-destructive" : "text-muted-foreground")}>
                {totalTickets.toLocaleString("en-US")} tickets
                {selectedVenue && ` of ${selectedVenue.capacity.toLocaleString("en-US")} at ${selectedVenue.name}`}
              </p>
            </div>
          </fieldset>

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
