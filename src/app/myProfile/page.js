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
import TicketList from "@/components/tickets/TicketList";

export default function MyProfile() {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();

  const [eventList, setEventList] = useState([]);
  const [ticketList, setTicketList] = useState([]);

  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);

  //Organizer Events
  useEffect(() => {
    if (router && !router.isReady) {
      //return;
    }
    if (isUserLoading || !user) return;
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
    };
    getEventsOwnedbyOrganizer();
  }, [user, isUserLoading]);

  //TicketList
  useEffect(() => {
    if (isUserLoading || !user) return;
    const getTicketList = async () => {
      try {
        var url = `/api/ticketOwnership/get/user/${user.id}`;
        const res = await fetch(url, { method: `GET` });
        const data = await res.json();
        if (res.ok) {
          setTicketList(data);
          //sort ticket list
        }
      } catch (e) {
        console.error(e);
      }
    };
    getTicketList();
  }, [user, isUserLoading]);

  //Transactions
  useEffect(() => {
    if (isUserLoading || !user) return;
    const getTransactions = async () => {
      try {
        var url = `/api/users/get/transactions/${user.id}`;
        const res = await fetch(url, { method: `GET` });
        const data = await res.json();
        if (res.ok) {
          setTransactions(data.transactions);
          //sort ticket list
        }
      } catch (e) {
        console.error(e);
      }
    };
    getTransactions();
  }, [user, isUserLoading]);

  useEffect(() => {
    if (!isUserLoading && user) {
      setLoading(false);
    }
  }, [isUserLoading, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-lg font-medium text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!user) {
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

        <h3 className="text-2xl font-bold">Your Ticket List</h3>
        <TicketList ticketList={ticketList} userID={user?.id}></TicketList>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-gray-600 mt-1">Transaction List</h2>

          <div className="grid grid-cols-3 gap-4">
            {transactions.map((transaction) => (
              <div
                key={transaction._id}
                className="text-gray-600 mt-1 rounded shadow-md flex flex-col items-center"
              >
                <span className="mt-2">
                  Transaction Date: {transaction?.transactionDate}
                </span>
                <span className="mt-2">
                  Transaction Type: {transaction?.transactionType}
                </span>
                <span className="mt-2">Status: {transaction?.status}</span>
                <h2 className="text-gray-600 mt-1">Tickets</h2>
                <div className="grid grid-cols-3 gap-4">
                  {transaction.tickets.map((ticket) => (
                    <div
                      key={ticket._id}
                      className="text-gray-600 mt-1 rounded shadow-md flex flex-col items-center"
                    >
                      <span className="mt-2">Price: ${ticket?.price}</span>
                      <span className="mt-2">Status: {ticket?.status}</span>
                      <span className="mt-2">
                        Seat Number: {ticket?.seatNumber}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
