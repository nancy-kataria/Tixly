"use client"
//import { useSession, getSession, signIn, signOut } from "next-auth/react";

import Link from "next/link";
//import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import avatar from "../../public/avatar.png";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";


export default function Navbar() {

  //const {data: clientSession, status, update} = useSession();
  //const session = serverSession || clientSession;

  //const[user, setUser] = useState(null);
  const {user} = useUser();
  const { refreshUser } = useUser();
  const router = useRouter();


  const handleSignOut = async () => {
      const res = await fetch("/api/auth/signOut", {
        method: "POST",
        credentials:"include",
      });

      if(res.ok)
      {
        await refreshUser();
        router.push("/login");
      }
      else
      {
        console.error("Failed to log out");
      }
  }

  
  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-blue-500 text-white shadow-md">
      {/* Logo */}
      <Link href="/" passHref>
        <div className="text-xl font-bold cursor-pointer">Event Booking</div>
      </Link>

      {/* Navigation Links */}
      <div className="flex space-x-6">
        <Link href="/" passHref>
          <div className="cursor-pointer hover:underline">Explore</div>
        </Link>

        {user?.userType === "Organizer" && (
            <Link href="/createEvent" passHref>
              <div className="cursor-pointer hover:underline">Create Event</div>
            </Link>
          )
        }

        {user ? (
           <button
           onClick={() => handleSignOut()}
           className="hover:underline bg-transparent border-none"
         > Sign Out</button>
        ) : (
          <Link href="login" passHref>
            <div className="cursor-pointer hover:underline">Sign In</div>
          </Link>
        )}

        {user && (
          <Link
            href={{
              pathname: "/myProfile",
              query: {
                userId: user.id,
              },
            }}
            passHref
          >
            <div className="relative w-10 h-10">
              <Image
                src={avatar}
                alt="avatar"
                className="rounded-full"
                fill
                objectFit="cover"
              />
            </div>
          </Link>
        )}
      </div>
    </nav>
  );
}
