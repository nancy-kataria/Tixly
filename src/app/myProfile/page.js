"use client";


import { useEffect, useState } from "react";
// import { useRouter } from "next/router";
// This is the same useRouter hook, but can be used in both
// app and pages directories.
// It differs from next/router in that it does not throw an
// error when the pages router is not mounted, and instead has a
// return type of NextRouter | null. This allows developers to
// convert components to support running in both app and pages as they transition to the app router.
//import { useRouter } from "next/compat/router";
import { useSearchParams, useRouter } from "next/navigation";
import EventList from "@/components/EventList";

import { useUser } from "@/context/UserContext";

export default function MyProfile() {
  const router = useRouter();
  const {user} = useUser();

  const [eventList, setEventList] = useState([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (router && !router.isReady) {
      //return;
    }
    //const id = searchParams.get("userId");
    //console.log(`${id}  ,   ${user?.id}`)

    if(!user) return;
    const getEventsOwnedbyOrganizer = async () => {
      try {
        const response = await fetch(`/api/events/get/organizerID/${user.id}`, {
          method: "GET",
        });
        const data = await response.json();
        setEventList(data);
      } catch (error) {
        console.error(error);
      }
      finally{setLoading(false)}
    };

    getEventsOwnedbyOrganizer();
  }, [user]);

  const handleEventClick = async () => {
    
  }


  console.log(user);
  console.log(eventList);

  if(loading){
    return(<div className="min-h-screen flex items-center justify-center bg-gray-100">
      <p className="text-lg font-medium text-gray-600">Loading...</p>
    </div>
    );
  }

  if(!user){
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-lg font-medium text-gray-600">
          You need to log in to view this page.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="text-gray-800">
        <h3 className="text-2xl font-bold">{user.userType}</h3>
        <p className="text-lg font-medium">{user.name}</p>
        <h3 className="text-2xl font-bold">Your Event List</h3>
        <EventList eventList={eventList}></EventList>

      </div>
    </div>
  );
}
