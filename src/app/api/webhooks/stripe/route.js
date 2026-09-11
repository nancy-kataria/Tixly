import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { fulfillCheckoutSession } from "@/lib/fulfillment";

// Stripe calls this when a payment page is paid or expires. Replying with an
// error makes Stripe retry later, which is safe: fulfillment can repeat.
export async function POST(request) {
  const stripe = getStripe();

  // The signature is computed over the exact raw body, so read it as text.
  const body = await request.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      request.headers.get("stripe-signature"),
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return NextResponse.json({ error: `Webhook signature check failed: ${err.message}` }, { status: 400 });
  }

  const session = event.data.object;
  const orderId = session.metadata?.order_id;
  if (!orderId) {
    return NextResponse.json({ received: true }); // not a Tixly checkout
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        // Does nothing until payment_status is "paid" (cards are paid at once).
        await fulfillCheckoutSession(session);
        break;

      case "checkout.session.expired": {
        const { error } = await createAdminClient().rpc("expire_order", { p_order_id: orderId });
        if (error) throw new Error(`expire_order failed: ${error.message}`);
        break;
      }
    }
  } catch (err) {
    console.error(`Stripe webhook ${event.type} failed:`, err);
    return NextResponse.json({ error: "Webhook handling failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
