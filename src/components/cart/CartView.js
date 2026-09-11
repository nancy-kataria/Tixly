"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, Lock, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/context/UserContext";
import Card from "@/components/ui/Card";
import Button, { buttonClasses } from "@/components/ui/Button";
import { formatEventDate, formatPrice, ticketLabel } from "@/lib/format";

// A held ticket's price: the resale price if it's listed, else face value.
function priceOf(ticket) {
  return ticket.status === "listed" ? ticket.list_price_cents : ticket.price_cents;
}

function formatCountdown(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

// tickets: the user's held tickets, with section and event.
export default function CartView({ tickets, checkoutCancelled }) {
  const router = useRouter();
  const { refreshCart } = useUser();
  const [now, setNow] = useState(null); // set after mount, so server and browser render the same
  const [pendingId, setPendingId] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState("");

  // Everything in a cart shares one timer.
  const expiresAt = tickets.length
    ? Math.min(...tickets.map((ticket) => new Date(ticket.held_until).getTime()))
    : null;
  const remainingMs = expiresAt && now ? expiresAt - now : null;
  const hasExpired = remainingMs !== null && remainingMs <= 0;

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const firstTick = setTimeout(tick, 0);
    const interval = setInterval(tick, 1000);
    return () => {
      clearTimeout(firstTick);
      clearInterval(interval);
    };
  }, []);

  // When the timer runs out, reload: the tickets are back on sale.
  useEffect(() => {
    if (hasExpired) {
      router.refresh();
      refreshCart();
    }
  }, [hasExpired, router, refreshCart]);

  const handleRemove = async (ticketId) => {
    setPendingId(ticketId);
    setError("");
    const { error } = await createClient().rpc("release_ticket", { p_ticket_id: ticketId });
    setPendingId(null);
    if (error) {
      setError(error.message);
      return;
    }
    refreshCart();
    router.refresh();
  };

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    setError("");
    try {
      const response = await fetch("/api/checkout", { method: "POST" });
      // Tolerate a non-JSON reply (e.g. the server crashed or timed out).
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "Checkout isn't available right now. Please try again.");
      }
      window.location.assign(data.url); // Stripe's payment page
    } catch (checkoutError) {
      setError(checkoutError.message);
      setIsCheckingOut(false);
    }
  };

  if (tickets.length === 0 || hasExpired) {
    return (
      <Card className="p-8 text-center">
        <h1 className="text-3xl font-medium tracking-tight">
          {hasExpired ? "Your cart expired" : "Your cart is empty"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {hasExpired
            ? "Tickets are held for 10 minutes. They're back on sale now."
            : "Tickets you add are held for you for 10 minutes."}
        </p>
        <Link href="/#events" className={buttonClasses({ className: "mt-6" })}>
          Find tickets
        </Link>
      </Card>
    );
  }

  const total = tickets.reduce((sum, ticket) => sum + priceOf(ticket), 0);
  const sortedTickets = [...tickets].sort(
    (a, b) => a.event.starts_at.localeCompare(b.event.starts_at) || a.section.name.localeCompare(b.section.name) || a.number - b.number
  );

  return (
    <Card className="p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl font-medium tracking-tight">Your cart</h1>
        <span className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
          <Clock className="size-4" aria-hidden />
          Held for <span className="w-11 tabular-nums" aria-live="off">{remainingMs === null ? "–:––" : formatCountdown(remainingMs)}</span>
        </span>
      </div>

      {checkoutCancelled && (
        <p className="mt-4 rounded-panel bg-secondary/60 px-4 py-3 text-sm">
          Payment cancelled, and nothing was charged. Your tickets are still held until the timer runs out.
        </p>
      )}

      <ul className="mt-6 divide-y divide-border">
        {sortedTickets.map((ticket) => (
          <li key={ticket.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div className="min-w-0">
              <Link href={`/event/${ticket.event.id}`} className="font-medium hover:text-primary-text">
                {ticket.event.name}
              </Link>
              <p className="text-sm text-muted-foreground">
                {ticketLabel(ticket)}
                {ticket.status === "listed" && " · resale"} · {formatEventDate(ticket.event.starts_at)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold">{formatPrice(priceOf(ticket))}</span>
              <Button
                variant="ghost"
                size="sm"
                disabled={pendingId === ticket.id || isCheckingOut}
                onClick={() => handleRemove(ticket.id)}
                aria-label={`Remove ${ticketLabel(ticket)} from cart`}
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-2 flex items-center justify-between border-t border-border pt-5">
        <span className="text-muted-foreground">
          Total · {tickets.length} {tickets.length === 1 ? "ticket" : "tickets"}
        </span>
        <span className="text-2xl font-semibold">{formatPrice(total)}</span>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-panel bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="mt-6 rounded-panel border border-primary/40 bg-secondary/60 px-4 py-3 text-sm text-secondary-foreground">
        <span className="mr-2 inline-block rounded-full bg-primary px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-primary-foreground">
          Test mode
        </span>
        Stripe is in test mode, so no real money is charged. Pay with card{" "}
        <span className="font-mono font-semibold">4242 4242 4242 4242</span>, any future expiry date and any CVC.
      </div>

      <Button size="lg" className="mt-4 w-full" onClick={handleCheckout} disabled={isCheckingOut}>
        <Lock className="size-4" aria-hidden />
        {isCheckingOut ? "Opening secure checkout…" : `Checkout · ${formatPrice(total)}`}
      </Button>
    </Card>
  );
}
