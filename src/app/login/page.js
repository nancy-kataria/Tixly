import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export default async function LoginPage({ searchParams }) {
  // Already signed in? Nothing to do here.
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) redirect("/");

  const { error } = await searchParams;

  return (
    <div className="flex items-center justify-center min-h-screen p-8 bg-gray-100 text-gray-800">
      <div className="mx-8">
        <h2 className="text-4xl font-bold text-gray-800 mb-4">
          Welcome to Tixly!
        </h2>
        <p>
          Shop Hundreds Of Live Events And Discover Can&apos;t-Miss Concerts, Games,
          Theater And More.
        </p>
      </div>
      <div className="w-full max-w-md p-6 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-semibold text-center text-gray-700">
          Sign In
        </h1>
        {error && (
          <p className="text-sm text-center text-red-600">
            Sign-in didn&apos;t complete. Please try again.
          </p>
        )}
        <GoogleSignInButton />
      </div>
    </div>
  );
}
