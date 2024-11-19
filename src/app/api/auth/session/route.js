import { getServerSession } from "next-auth";

export async function GET(req) {
  try {
    const session = await getServerSession(req);

    if (session) {
      return new Response(
        JSON.stringify({ user: session.user }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
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
