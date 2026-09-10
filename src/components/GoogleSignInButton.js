"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// next: optional path to land on after sign-in (defaults to the home page).
export default function GoogleSignInButton({ next }) {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async () => {
    setIsRedirecting(true);
    setError("");
    // Remember where to go after sign-in. /auth/callback reads this cookie.
    // Using a cookie keeps the redirect URL free of query params, which
    // Supabase's Redirect URLs allow-list would otherwise have to match.
    if (next) {
      document.cookie = `auth_next=${encodeURIComponent(next)}; path=/; max-age=600; samesite=lax`;
    }
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
