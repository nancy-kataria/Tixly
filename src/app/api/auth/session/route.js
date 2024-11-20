import { getServerSession } from "next-auth";

// Next.js API route function
// handles HTTP GET requests
export async function GET(req) {
  try {
    // getServerSession checks if the user is authenticated by verifying their session token, usually stored in cookies or headers.
    const session = await getServerSession(req);

    if (session) {
      // If the user is authenticated, the response sends back the user information in JSON format with a status code of 200
      return new Response(
        JSON.stringify({ user: session.user }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
      // new Response() creates an HTTP response object that can be returned to the client making the request
      // It is a part of the Web Fetch API
    } else {
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error in GET session:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
