// components/Navbar.js
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';


export default function Navbar() {
  const {user} = useAuth();
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

        {user ? (
      <>
      {user.userType === "Organizer" && (
        <Link href="/createEvent" passHref>
        <div className="cursor-pointer hover:underline">Create Event</div>
      </Link>
      )}
      </>
        ) :
        (
        <Link href="/login" passHref>
          <div className="cursor-pointer hover:underline">Sign In</div>
        </Link>
        )}
        
      </div>
    </nav>
  );
}
