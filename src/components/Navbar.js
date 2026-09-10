"use client"

import Link from "next/link";
import Image from "next/image";
import avatar from "../../public/avatar.png";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";


export default function Navbar() {
  const { user, signOut } = useUser();
  const router = useRouter();

  const handleSignOut = async () => {
    if (await signOut()) {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-black-500 text-white shadow-md">
      {/* Logo */}
      <Link href="/" passHref>
        <div className="text-xl font-bold cursor-pointer">Tixly</div>
      </Link>

      {/* Navigation Links */}
      <div className="flex space-x-6">
        <Link href="/" passHref>
          <div className="cursor-pointer hover:underline">Explore</div>
        </Link>

        {user?.role === "organizer" && (
            <Link href="/createEvent" passHref>
              <div className="cursor-pointer hover:underline">Create Event</div>
            </Link>
          )
        }

        {user ? (
          <button
            onClick={handleSignOut}
            className="cursor-pointer hover:underline"
          >
            Sign Out
          </button>
        ) : (
          <Link href="/login" passHref>
            <div className="cursor-pointer hover:underline">Sign In</div>
          </Link>
        )}

        {user && (
          <Link href="/myProfile" passHref>
            <div className="relative w-8 h-8">
              <Image
                src={user.avatarUrl || avatar}
                alt="avatar"
                className="rounded-full object-cover"
                fill
                sizes="32px"
              />
            </div>
          </Link>
        )}
      </div>
    </nav>
  );
}
