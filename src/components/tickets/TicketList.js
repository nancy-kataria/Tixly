// components/TicketList.js
"use client";

import { useState, useEffect } from "react";
import SellTicketModal from "../Modals/sellTicketModal";
import Link from "next/link";

export default function TicketList({ ticketList, userID, viewType = "event" }) {
  const [sortBy, setSortBy] = useState("status");
  const [sortedticketList, setSortedticketList] = useState([...ticketList]);
  const [isModalOpen, setIsModalOpen] = useState({
    ticketId: "",
    open: false,
  });

  const openModal = (ticketId) => {
    setIsModalOpen({ ticketId: ticketId, open: true });
  };
  const closeModal = () =>
    setIsModalOpen({
      ticketId: "",
      open: false,
    });
  //Sorts the Tickets
  useEffect(() => {
    if (ticketList && Array.isArray(ticketList)) {
      const sortedList = [...ticketList].sort((a, b) => {
        if (sortBy === "seatNumber") {
          return a.seatNumber - b.seatNumber;
        }
        return a[sortBy]?.localeCompare(b[sortBy]);
      });
      setSortedticketList(sortedList);
    }
  }, [ticketList, sortBy]);

  //Groups tickets by the event
  const ticketsByEvent =
    viewType === "user"
      ? sortedticketList.reduce((acc, ticket) => {
          if (!acc[ticket.eventID]) {
            acc[ticket.eventID] = [];
          }
          acc[ticket.eventID].push(ticket);
          return acc;
        }, {})
      : { "All Tickets": sortedticketList };

  const handleTicketAction = async (ticketId, action) => {
    try {
      if (!userID || userID === "") return;

      const res = await fetch(`/api/tickets/update/${ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userID, action }),
      });

      if (res.ok) {
        setSortedticketList((prevTicketList) =>
          prevTicketList.map((ticket) =>
            ticket._id === ticketId
              ? {
                  ...ticket,
                  status: action === "purchase" ? "Sold" : "Available",
                }
              : ticket
          )
        );
      } else {
        console.error("Failed to update ticket");
      }
    } catch (e) {
      console.error(e);
    }
  };
  if (!ticketList || ticketList.length === 0) {
    return <p className="text-sm font-medium">No Tickets yet</p>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-gray-800 mt-1 text-xl font-bold">Tickets</h2>
        <div>
          <label htmlFor="sort" className="text-gray-600 mt-1">
            Sort By:
          </label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-gray-600 mt-1"
          >
            <option value="status">Status</option>
            <option value="seatNumber">Seat Number</option>
          </select>
        </div>
      </div>

      {Object.entries(ticketsByEvent).map(([eventID, eventTickets]) => (
        <div key={eventID} className="mt-6 bg-white rounded-lg p-4 shadow-md">
          {viewType === "user" && (
            <Link href={`/event/${eventID}`} passHref>
              <button className="text-black-500 underline text-lg font-semibold mb-4 hover:text-blue-700">
                View Event: {eventID}
              </button>
            </Link>
          )}
          <div className="grid grid-cols-8 gap-4" key={Math.random()}>
            {eventTickets.map((ticket) => (
              <div
                key={ticket._id}
                className="text-gray-600 mt-1 rounded shadow-md flex flex-col items-center p-2"
              >
                <span className="text-lg font-semibold">
                  Seat {ticket.seatNumber}
                </span>

                <span className="mt-2">${ticket.price}</span>
                {/*If The ticket is available and the User does not own it "Purchase" */}
                {ticket.status === "Available" && !ticket.isOwnedByUser && (
                  <button
                    onClick={() => handleTicketAction(ticket._id, "purchase")}
                    className="mt-4 px-4 py-2 rounded text-white bg-green-500"
                  >
                    Buy
                  </button>
                )}
                {/*If The ticket not is available and the User owns it "sell" */}
                {ticket.status !== "Available" && ticket.isOwnedByUser && (
                  <button
                    onClick={() => handleTicketAction(ticket._id, "sell")}
                    className="mt-4 px-4 py-2 rounded text-white bg-yellow-500"
                  >
                    Sell
                  </button>
                )}
                {/*If The ticket is not available and the User owns it "Transfer" */}
                {ticket.status !== "Available" && ticket.isOwnedByUser && (
                  <button
                    onClick={() => openModal(ticket._id)}
                    className="mt-4 px-4 py-2 rounded text-white bg-yellow-500"
                  >
                    Transfer
                  </button>
                )}
                {/*If The ticket is available and the User owns it "cancel sell" */}
                {ticket.status === "Available" && ticket.isOwnedByUser && (
                  <button
                    onClick={() => handleTicketAction(ticket._id, "cancel")}
                    className="mt-4 px-4 py-2 rounded text-white bg-red-500"
                  >
                    Cancel
                  </button>
                )}
                {/*If The ticket is not available and the User does not own it "Unavailable" */}

                {ticket.status !== "Available" && !ticket.isOwnedByUser && (
                  <button
                    disabled
                    className="mt-4 px-4 py-2 rounded text-white bg-gray-500 cursor-not-allowed"
                  >
                    Unavailable
                  </button>
                )}
                {isModalOpen.open && isModalOpen.ticketId === ticket._id && (
                  <SellTicketModal
                    closeModal={closeModal}
                    ticketId={ticket._id}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
