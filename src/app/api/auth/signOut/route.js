import { getServerSession } from "next-auth";
import { destroySession } from "@/lib/sessionManagement";

export async function POST(request) {
  try {
    const session = await getServerSession(request);

    if (!session) {
      return new Response(JSON.stringify({ error: "No active session" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    await destroySession(session);

    return new Response(JSON.stringify({ message: "Signout successful" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in Signout:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
