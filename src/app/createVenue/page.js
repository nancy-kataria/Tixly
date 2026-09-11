"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/context/UserContext";
import Card from "@/components/ui/Card";
import Eyebrow from "@/components/ui/Eyebrow";
import Button, { buttonClasses } from "@/components/ui/Button";
import Input, { Label } from "@/components/ui/Input";

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
    return <p className="px-6 py-16 text-center text-muted-foreground">Loading…</p>;
  }

  if (user?.role !== "organizer") {
    return (
      <div className="mx-auto max-w-lg px-6 py-16">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-medium tracking-tight">Only organizers can add venues</h1>
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
        <h1 className="mt-1 text-4xl font-medium tracking-tight">Add a venue</h1>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleFormDataChange}
              required
              placeholder="Harbor Amphitheater"
            />
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleFormDataChange}
              required
              placeholder="120 Bayfront Dr, Long Beach, CA"
            />
          </div>

          <div>
            <Label htmlFor="capacity">Capacity (up to 100,000 people)</Label>
            <Input
              type="number"
              min="1"
              max="100000"
              id="capacity"
              name="capacity"
              value={formData.capacity}
              onChange={handleFormDataChange}
              required
              placeholder="120"
            />
          </div>

          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

          <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Saving…" : "Add venue"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/createEvent" className="font-medium text-primary-text hover:underline">
            Back to creating an event
          </Link>
        </p>
      </Card>
    </div>
  );
}

export default Page;
