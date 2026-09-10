"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/context/UserContext";

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
    await refreshUser(); // so the navbar shows "Create Event"
    router.push("/createEvent");
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isSubmitting}
        className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-60"
      >
        {isSubmitting ? "Setting up…" : "Become an organizer"}
      </button>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
