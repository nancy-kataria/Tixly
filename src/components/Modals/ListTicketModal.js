"use client";
import { useState } from "react";
import { formatPrice } from "@/lib/format";

// Asks for a resale price. onConfirm(priceCents) resolves to an error
// message, or null on success.
export default function ListTicketModal({ ticket, onConfirm, onClose }) {
  const [price, setPrice] = useState((ticket.price_cents / 100).toFixed(2));
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const priceCents = Math.round(Number(price) * 100);
    if (!Number.isFinite(priceCents) || priceCents <= 0) {
      setError("Enter a price above $0.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    const message = await onConfirm(priceCents);
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
        <h2 className="text-xl font-semibold mb-1">Sell seat {ticket.seat_number}</h2>
        <p className="text-sm text-gray-600 mb-4">
          Face value {formatPrice(ticket.price_cents)}. Buyers see your price on the
          event page, and you keep the ticket until someone buys it.
        </p>
        <label htmlFor="list-price" className="block text-sm font-medium mb-1">
          Your price (USD)
        </label>
        <input
          id="list-price"
          type="number"
          min="0.01"
          step="0.01"
          required
          value={price}
          onChange={(e) => setPrice(e.target.value)}
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
            disabled={isSubmitting}
            className="px-4 py-2 bg-black text-white rounded disabled:opacity-60"
          >
            {isSubmitting ? "Listing…" : "List for sale"}
          </button>
        </div>
      </form>
    </div>
  );
}
