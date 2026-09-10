"use client";
import { useState } from "react";

// Asks for the recipient's email. onConfirm(email) resolves to an error
// message, or null on success.
export default function TransferTicketModal({ ticket, onConfirm, onClose }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    const message = await onConfirm(email);
    setIsSubmitting(false);
    if (message) setError(message);
    else onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full text-gray-800"
      >
        <h2 className="text-xl font-semibold mb-1">Transfer seat {ticket.seat_number}</h2>
        <p className="text-sm text-gray-600 mb-4">
          The ticket moves to the Tixly account with this email. If it&apos;s
          listed for sale, the listing is cancelled.
        </p>
        <input
          type="email"
          placeholder="Recipient's email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        <div className="flex justify-end space-x-4 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Close
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !email}
            className="px-4 py-2 bg-black text-white rounded disabled:opacity-60"
          >
            {isSubmitting ? "Transferring…" : "Transfer"}
          </button>
        </div>
      </form>
    </div>
  );
}
