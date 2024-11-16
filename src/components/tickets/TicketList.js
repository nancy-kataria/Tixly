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

  const purchaseTicket = async (ticketId) => {
    try {
      const res = await fetch(`/api/tickets/purchase/${ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userID, eventID }),
      });

      if (res.ok) {
        setSortedTickets((prevTickets) =>
          prevTickets.map((ticket) =>
            ticket._id === ticketId ? { ...ticket, status: "Sold" } : ticket
          )
        );
      } 
      else {
        const errorData = await res.json();
        console.error("Error purchasing ticket:", errorData.error);
      }
    } catch (error) {
      console.error("Error purchasing ticket:", error);
    }
  };

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
            <button
              disabled={ticket.status !== "Available"}
              onClick={() => purchaseTicket(ticket._id)}
              className={`mt-4 px-4 py-2 rounded text-white ${
                ticket.status === "Available" ? "bg-green-500" : "bg-gray-500"
              }`}
            >
              {ticket.status === "Available" ? "Buy" : "Sold"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
