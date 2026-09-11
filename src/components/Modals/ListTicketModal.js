"use client";
import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input, { Label } from "@/components/ui/Input";
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
    <Modal
      title={`Sell seat ${ticket.seat_number}`}
      description={`Face value ${formatPrice(ticket.price_cents)}. Buyers see your price on the event page, and you keep the ticket until someone buys it.`}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <Label htmlFor="list-price">Your price (USD)</Label>
        <Input
          id="list-price"
          type="number"
          min="0.01"
          step="0.01"
          required
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Listing…" : "List for sale"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
