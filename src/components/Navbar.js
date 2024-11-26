"use client"
import { useSession, signIn, signOut } from "next-auth/react";

import Link from "next/link";
//import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import avatar from "../../public/avatar.png";

export default function Navbar({ router }) {
  //const { user } = useAuth();
  //const { signOut } = useAuth();
  const {data: session, status} = useSession();

  const handleSignOut = () => {
    //signOut();
    router.push("/");
  };

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

        {session ? (
          session.user.userType === "Organizer" && (
            <Link href="/createEvent" passHref>
              <div className="cursor-pointer hover:underline">Create Event</div>
            </Link>
          )
        ) : (
          <></>
        )}

        {session ? (
          <div
            className="cursor-pointer hover:underline"
            onClick={handleSignOut}
          >
            Sign Out
          </div>
        ) : (
          <Link href="login" passHref>
            <div className="cursor-pointer hover:underline">Sign In</div>
          </Link>
        )}

        {session && (
          <Link
            href={{
              pathname: "/myProfile",
              query: {
                userId: session.user.id,
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
