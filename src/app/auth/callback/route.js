import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// After Google sign-in, Supabase redirects here with a one-time code.
// Exchanging it sets the session cookie, then we send the user home.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Behind a load balancer (e.g. Vercel), origin is the internal host.
      const forwardedHost = request.headers.get("x-forwarded-host");
      if (process.env.NODE_ENV !== "development" && forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}/`);
      }
      return NextResponse.redirect(`${origin}/`);
    }
    console.error("Failed to exchange auth code:", error);
  }

  // No code (e.g. the user cancelled on Google) or the exchange failed.
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
