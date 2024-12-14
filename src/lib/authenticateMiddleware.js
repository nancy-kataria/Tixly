import { jwtVerify } from "jose";
import { cookies } from "next/headers";

export async function authenticate() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;

  } catch (e) {
    console.error("Token verification failed:", e);
    return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
      status: 401,
    });
  }
}
