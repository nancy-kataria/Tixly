import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { authenticate } from "@/lib/authenticateMiddleware";


export async function GET(req) {

    try{
        const user = await authenticate();
        if(user instanceof Response)
            return user;
    }catch(e)
    {
        return new Response(JSON.stringify({error:e}, { status: 401 }));
    }

    const cookieStore = cookies();
    const token = (await cookieStore).get("token")?.value;

    if (!token) {
        return new Response(JSON.stringify({ message: 'No token' }), { status: 401 });
    }

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);

        return new Response(JSON.stringify(payload), { status: 200 }); // Return user data
    } catch (err) {
        return new Response(JSON.stringify({error: "Expired or invalid token"}, { status: 401 }));

    }
}
