import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials"
import connectDB from '@/lib/mongooseDB';
import User from "@/models/Users";


export const authOptions = {
    providers: [
        CredentialsProvider({
            name:"credentials",
            credentials: { 
                email: { label: "Email", type: "text", placeholder: "user@example.com" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials){
                console.log("Authorizing credentials")
                const res = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/signIn`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(credentials),
                  });
                  const user = await res.json();
                  if (res.ok && user)  return user;
            return null;
            }
        })
    ],
    callbacks: {
        async jwt({token, user}){
            if (user){
                token.id = user.id;
                token.userType = user.userType;
            }
            return token;
        },
        async session({session, token}){
            if (token) {
                session.user.id = token.id;
                session.user.userType = token.userType;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "@/login",
        error: "@/error"
    }
    
}
const handler = NextAuth(authOptions);
export {handler as GET, handler as POST};