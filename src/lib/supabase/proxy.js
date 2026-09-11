import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

// Pages that require a signed-in user. Everything else is public.
const PROTECTED_PATHS = ["/myProfile", "/createEvent", "/createVenue", "/cart", "/orders"];

// Refreshes the Supabase session cookie on every request and redirects
// signed-out users away from protected pages.
export async function updateSession(request) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Don't run code between createServerClient and getClaims(). getClaims()
  // is what refreshes an expired session; skipping it logs users out randomly.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const { pathname } = request.nextUrl;
  if (!user && PROTECTED_PATHS.some((path) => pathname.startsWith(path))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    const redirectResponse = NextResponse.redirect(url);
    // Keep any cookie changes Supabase made, e.g. clearing an expired session.
    supabaseResponse.cookies
      .getAll()
      .forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  }

  // Return supabaseResponse unchanged so refreshed cookies reach the browser.
  return supabaseResponse;
}
