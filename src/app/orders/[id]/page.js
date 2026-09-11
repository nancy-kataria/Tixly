import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleCheck, CircleAlert, Ticket } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { fulfillCheckoutSession } from "@/lib/fulfillment";
import RefreshWhilePending from "@/components/cart/RefreshWhilePending";
import Card from "@/components/ui/Card";
import { buttonClasses } from "@/components/ui/Button";
import { formatEventDate, formatPrice, ticketLabel } from "@/lib/format";

// Where Stripe sends buyers after paying (with ?session_id=...).
export default async function OrderPage({ params, searchParams }) {
  const { id } = await params;
  const { session_id: sessionId } = await searchParams;
  const supabase = await createClient();

  // RLS only returns the signed-in buyer's own orders.
  const fetchOrder = () =>
    supabase
      .from("orders")
      .select("id, status, total_cents, items:order_items(id, price_cents, seller_id, ticket:tickets(number, section:ticket_sections(name), event:events(id, name, starts_at)))")
      .eq("id", id)
      .maybeSingle();

  let { data: order } = await fetchOrder();
  if (!order) notFound();

  // Don't wait for the webhook: if Stripe says this checkout is paid,
  // confirm it now. (Safe even if the webhook does it too.)
  if (order.status === "pending" && sessionId) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId);
      if (session.metadata?.order_id === order.id) {
        await fulfillCheckoutSession(session);
        ({ data: order } = await fetchOrder());
      }
    } catch (error) {
      console.error("Could not confirm the payment on return:", error);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Card className="p-8 sm:p-10">
        {order.status === "pending" && (
          <>
            <h1 className="text-3xl font-medium tracking-tight">Confirming your payment…</h1>
            <p className="mt-2 text-muted-foreground">This usually takes a few seconds.</p>
            <div className="mt-6">
              <RefreshWhilePending orderId={order.id} />
            </div>
          </>
        )}

        {order.status === "paid" && (
          <>
            <CircleCheck className="size-12 text-primary-text" aria-hidden />
            <h1 className="mt-4 text-4xl font-medium tracking-tight">You&apos;re going!</h1>
            <p className="mt-2 text-muted-foreground">
              Your {order.items.length === 1 ? "ticket is" : `${order.items.length} tickets are`} in My tickets.
            </p>
          </>
        )}

        {order.status === "refunded" && (
          <>
            <CircleAlert className="size-12 text-destructive" aria-hidden />
            <h1 className="mt-4 text-3xl font-medium tracking-tight">We couldn&apos;t get those tickets</h1>
            <p className="mt-2 text-muted-foreground">
              Some of them were taken before your payment went through, so we refunded you in full.
            </p>
          </>
        )}

        {(order.status === "expired" || order.status === "cancelled") && (
          <>
            <h1 className="text-3xl font-medium tracking-tight">This checkout wasn&apos;t completed</h1>
            <p className="mt-2 text-muted-foreground">Nothing was charged.</p>
          </>
        )}

        <ul className="mt-8 divide-y divide-border border-y border-border">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-4 py-3">
              <span className="flex items-center gap-3">
                <Ticket className="size-4 shrink-0 text-primary-text" aria-hidden />
                <span>
                  <span className="font-medium">{item.ticket.event.name}</span>
                  <span className="block text-sm text-muted-foreground">
                    {ticketLabel(item.ticket)}
                    {item.seller_id && " · resale"} · {formatEventDate(item.ticket.event.starts_at)}
                  </span>
                </span>
              </span>
              <span className="font-medium">{formatPrice(item.price_cents)}</span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between pt-4">
          <span className="text-muted-foreground">Total</span>
          <span className="text-xl font-semibold">{formatPrice(order.total_cents)}</span>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {order.status === "paid" ? (
            <Link href="/myProfile" className={buttonClasses()}>
              View my tickets
            </Link>
          ) : (
            <Link href="/cart" className={buttonClasses({ variant: "outline" })}>
              Back to cart
            </Link>
          )}
          <Link href="/#events" className={buttonClasses({ variant: "ghost" })}>
            Find more events
          </Link>
        </div>
      </Card>
    </div>
  );
}
