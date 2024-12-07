import React, { useState } from "react";

function SellTicketModal({ closeModal, ticketId }) {
  const [email, setEmail] = useState("");

  //   Does the task but goes into a promise
  const handleTicketTransfer = () => {
    try {
      const response = fetch(`/api/ticketOwnership/update/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: email }),
      });

      if (response.ok) {
        alert("Ticket Transfered");
        closeModal();
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full text-gray-800">
        <h2 className="text-xl font-semibold mb-4">Transfer your Ticket</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-400"
        />
        <div className="flex justify-end space-x-4">
          <button
            onClick={handleTicketTransfer}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Tranfer
          </button>
          <button
            onClick={closeModal}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default SellTicketModal;
