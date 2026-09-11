"use client";
import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input, { Label } from "@/components/ui/Input";
import { ticketLabel } from "@/lib/format";

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
    <Modal
      title={`Transfer ${ticketLabel(ticket)}`}
      description="The ticket moves to the Tixly account with this email. If it's listed for sale, the listing is cancelled."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <Label htmlFor="recipient-email">Recipient&apos;s email</Label>
        <Input
          id="recipient-email"
          type="email"
          placeholder="friend@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !email}>
            {isSubmitting ? "Transferring…" : "Transfer"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
