// components/TicketList.js
"use client";

import  { useState, useEffect } from "react";

export default function TicketList({ tickets, eventID, userID }) {
  const [sortBy, setSortBy] = useState("status");
  const [sortedTickets, setSortedTickets] = useState([...tickets]);

  useEffect(() => {
    if(tickets && Array.isArray(tickets))
    {
    // Sort tickets whenever sortBy changes
    setSortedTickets((prevTickets) =>
      [...prevTickets].sort((a, b) => {
        if (sortBy === "seatNumber") {
          return a.seatNumber - b.seatNumber;
        }
        return a[sortBy].localeCompare(b[sortBy]);
    }));
    }
  }, [sortBy, tickets]);

  const handleTicketAction = async(ticketId, action) => {
    try{
      if(!userID || userID === "") return;
      console.log("Ticket Action called");

      const res = await fetch(`/api/tickets/update/${ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventID, userID , action }), // No need to send `userID`
      });

      if(res.ok){
        setSortedTickets((prevTickets) =>
          prevTickets.map((ticket) =>
            ticket._id === ticketId ? {
                ...ticket,
                  status: action === "buy" ? "Sold" : "Available",
                }
              : ticket
          ))
        }
          else{
            setSortedTickets(updatedTickets);
          }
    }catch(e){
      console.log(e);
    }
  }
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-gray-600 mt-1">Tickets</h2>
        <div>
          <label htmlFor="sort" className="text-gray-600 mt-1">Sort By:</label>
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

      <div className="grid grid-cols-3 gap-4">
        {sortedTickets.map((ticket) => (
          <div
            key={ticket._id}
            className="text-gray-600 mt-1 rounded shadow-md flex flex-col items-center"
          >
            <span className="text-lg font-semibold">Seat {ticket.seatNumber}</span>
            
            <span className="mt-2">${ticket.price}</span>

            {/*If The ticket is available and the User doesnt own it "buy" */}
            {ticket.status === "Available" && !ticket.isOwnedByUser && (
              <button
                onClick={() => handleTicketAction(ticket._id, "purchase")}
                className="mt-4 px-4 py-2 rounded text-white bg-green-500"
              >
                Buy
              </button>
            )}
            {/*If The ticket is not available and the User owns it "sell" */}
            {ticket.status !== "Available" && ticket.isOwnedByUser && (
              <button
                onClick={() => handleTicketAction(ticket._id, "sell")}
                className="mt-4 px-4 py-2 rounded text-white bg-yellow-500"
              >
                Sell
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
            {/*If The ticket is not available and the User doesnt own it "Unavailable" */}
            {ticket.status !== "Available" && !ticket.isOwnedByUser && (
              <button
                disabled
                className="mt-4 px-4 py-2 rounded text-white bg-gray-500 cursor-not-allowed"
              >
                Unavailable
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
