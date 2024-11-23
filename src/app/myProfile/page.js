"use client";

import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
// import { useRouter } from "next/router";
// This is the same useRouter hook, but can be used in both
// app and pages directories.
// It differs from next/router in that it does not throw an
// error when the pages router is not mounted, and instead has a
// return type of NextRouter | null. This allows developers to
// convert components to support running in both app and pages as they transition to the app router.
import { useRouter } from "next/compat/router";

export default function MyProfile() {
  const router = useRouter();
  const userData = useAuth();

  console.log(userData);
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar router={router} />
      <div className="text-gray-800">
        <h3 className="text-2xl font-bold">{userData.user.userType}</h3>
        <p className="text-sm font-medium">{userData.user.name}</p>
      </div>
    </div>
  );
}
