"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/context/UserContext";
import Button from "@/components/ui/Button";

export default function BecomeOrganizerButton() {
  const router = useRouter();
  const { refreshUser } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleClick = async () => {
    setIsSubmitting(true);
    setError("");
    const { error } = await createClient().rpc("become_organizer");
    if (error) {
      setError(error.message);
      setIsSubmitting(false);
      return;
    }
    await refreshUser(); // so the navbar shows "Create event"
    router.push("/createEvent");
  };

  return (
    <div>
      <Button onClick={handleClick} disabled={isSubmitting}>
        {isSubmitting ? "Setting up…" : "Become an organizer"}
      </Button>
      {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
