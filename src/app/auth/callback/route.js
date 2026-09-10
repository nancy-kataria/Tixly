import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

// Only allow paths on this site, so the cookie can't send users elsewhere.
function safeNextPath(value) {
  try {
    const path = value ? decodeURIComponent(value) : "/";
    return path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\")
      ? path
      : "/";
  } catch {
    return "/";
  }
}

// After Google sign-in, Supabase redirects here with a one-time code.
// Exchanging it sets the session cookie. Then we send the user to the page
// GoogleSignInButton saved in the auth_next cookie, or home.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const cookieStore = await cookies();
      const next = safeNextPath(cookieStore.get("auth_next")?.value);
      cookieStore.delete("auth_next");

      // Behind a load balancer (e.g. Vercel), origin is the internal host.
      const forwardedHost = request.headers.get("x-forwarded-host");
      if (process.env.NODE_ENV !== "development" && forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("Failed to exchange auth code:", error);
  }

  // No code (e.g. the user cancelled on Google) or the exchange failed.
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
