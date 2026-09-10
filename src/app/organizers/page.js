import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import BecomeOrganizerButton from "@/components/BecomeOrganizerButton";

// Entry point for people who want to sell tickets: sign in, then one click
// to become an organizer.
export default async function OrganizersPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  let role = null;
  if (userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();
    role = profile?.role;
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 p-8 flex justify-center items-start">
      <div className="max-w-xl w-full bg-white rounded-lg shadow-md p-8 space-y-4">
        <h1 className="text-3xl font-bold">Sell tickets on Tixly</h1>
        <p>
          Create events at your venues and set a ticket price. Tixly creates a
          ticket for every seat. Fans buy directly from you, and can resell or
          transfer their tickets without leaving the platform.
        </p>

        {!userId && (
          <>
            <p className="text-gray-600">
              Sign in first. You&apos;ll come straight back here to finish.
            </p>
            <GoogleSignInButton next="/organizers" />
          </>
        )}

        {userId && role !== "organizer" && <BecomeOrganizerButton />}

        {role === "organizer" && (
          <>
            <p className="text-green-700">You&apos;re an organizer.</p>
            <Link
              href="/createEvent"
              className="inline-block px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
            >
              Create an event
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
