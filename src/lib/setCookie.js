import { SignJWT } from "jose";
import {serialize} from "cookie";
import { headers } from "next/headers";


export default async function createUserCookie(user)
{
    try{
        console.log("Creating cookie");
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const token = await new SignJWT({email: user.email, id: user._id, userType: user.userType})
        .setProtectedHeader({alg:"HS256"})
        .setIssuedAt()
        .setExpirationTime("48h")
        .sign(secret);
    
        const cookie = serialize("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 3600, // 1 hour
            sameSite: "strict",
            path: "/",
        });

        return {token, headers: {"Set-Cookie": cookie}};
    }catch(e)
    {
        console.error(JSON.stringify(e));
        throw new Error("Failed to create cookie");
    }
    
}