import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

// Stripe's shortest allowed payment page. create_order() keeps the tickets
// held for 35 minutes, so they outlast the page.
const PAYMENT_PAGE_MINUTES = 31;

// Turns the signed-in user's cart into an order and returns the URL of a
// Stripe payment page for it. Prices come from the database, never from
// the browser. Always answers with JSON: { url } or { error }.
export async function POST(request) {
  try {
    return await startCheckout(request);
  } catch (error) {
    // e.g. a missing STRIPE_SECRET_KEY or SUPABASE_SECRET_KEY
    console.error("Checkout failed:", error);
    return NextResponse.json({ error: "Checkout isn't available right now. Please try again later." }, { status: 500 });
  }
}

async function startCheckout(request) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) {
    return NextResponse.json({ error: "Please sign in to check out." }, { status: 401 });
  }

  const stripe = getStripe();
  const admin = createAdminClient();

  // Close payment pages left open by an earlier checkout, so an old page
  // can't be paid after the cart has changed.
  const { data: openOrders } = await supabase
    .from("orders")
    .select("stripe_session_id")
    .eq("status", "pending")
    .not("stripe_session_id", "is", null);
  for (const order of openOrders ?? []) {
    // Fails if the page already expired or was paid; either is fine.
    await stripe.checkout.sessions.expire(order.stripe_session_id).catch(() => {});
  }

  // Also cancels any earlier unpaid order.
  const { data: order, error } = await supabase.rpc("create_order").single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const origin = request.headers.get("origin") ?? new URL(request.url).origin;
  const confirmationUrl = `${origin}/orders/${order.order_id}`;

  // Free tickets don't need a payment page.
  if (order.total_cents === 0) {
    const { error: completeError } = await admin.rpc("complete_order", {
      p_order_id: order.order_id,
      p_session_id: null,
      p_payment_intent_id: null,
      p_amount_total: 0,
    });
    if (completeError) throw completeError;
    return NextResponse.json({ url: confirmationUrl });
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("price_cents, seller_id, ticket:tickets(section:ticket_sections(name), event:events(name))")
    .eq("order_id", order.order_id);

  // One line per event, section and price: "Neon Tides · Premium" × 2
  const lines = new Map();
  for (const item of items ?? []) {
    const name = `${item.ticket.event.name} · ${item.ticket.section.name}${item.seller_id ? " (resale)" : ""}`;
    const key = `${name}|${item.price_cents}`;
    const line = lines.get(key) ?? { name, priceCents: item.price_cents, quantity: 0 };
    line.quantity += 1;
    lines.set(key, line);
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [...lines.values()].map((line) => ({
        quantity: line.quantity,
        price_data: {
          currency: "usd",
          unit_amount: line.priceCents,
          product_data: { name: line.name },
        },
      })),
      customer_email: user.email,
      client_reference_id: order.order_id,
      metadata: { order_id: order.order_id },
      payment_intent_data: { metadata: { order_id: order.order_id } },
      expires_at: Math.floor(Date.now() / 1000) + PAYMENT_PAGE_MINUTES * 60,
      // Stripe fills in {CHECKOUT_SESSION_ID}, so the confirmation page can
      // confirm the payment without waiting for the webhook.
      success_url: `${confirmationUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart?checkout=cancelled`,
    });

    await admin.from("orders").update({ stripe_session_id: session.id }).eq("id", order.order_id);
    return NextResponse.json({ url: session.url });
  } catch (stripeError) {
    console.error("Stripe checkout failed:", stripeError);
    // The tickets stay in the cart, so the buyer can simply try again.
    await admin.from("orders").update({ status: "cancelled" }).eq("id", order.order_id);
    return NextResponse.json({ error: "Couldn't open the payment page. Please try again." }, { status: 502 });
  }
}
