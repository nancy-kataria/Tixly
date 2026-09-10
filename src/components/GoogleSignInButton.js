"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function GoogleSignInButton() {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async () => {
    setIsRedirecting(true);
    setError("");
    const supabase = createClient();
    // Sends the browser to Google; it comes back via /auth/callback.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      console.error(error);
      setError("Couldn't start Google sign-in. Please try again.");
      setIsRedirecting(false);
    }
  };

  return (
    <>
      <button
        onClick={handleSignIn}
        disabled={isRedirecting}
        className="w-full py-2 font-medium text-white bg-black rounded-md hover:bg-gray-800 disabled:opacity-60"
      >
        {isRedirecting ? "Redirecting to Google…" : "Continue with Google"}
      </button>
      {error && <p className="text-sm text-center text-red-600">{error}</p>}
    </>
  );
}
