import "server-only";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// Hands over the tickets for a paid Stripe Checkout Session, or refunds the
// payment if the order can't be fulfilled. Safe to call more than once for
// the same session: the webhook and the confirmation page both call it.
// Returns complete_order()'s result, or null if the session isn't paid yet.
export async function fulfillCheckoutSession(session) {
  const orderId = session.metadata?.order_id;
  if (!orderId || session.payment_status !== "paid") return null;

  const { data: result, error } = await createAdminClient().rpc("complete_order", {
    p_order_id: orderId,
    p_session_id: session.id,
    p_payment_intent_id: session.payment_intent,
    p_amount_total: session.amount_total,
  });
  if (error) throw new Error(`complete_order failed: ${error.message}`);

  if (result === "refund_needed") {
    // The idempotency key makes repeated calls reuse the same refund.
    await getStripe().refunds.create(
      { payment_intent: session.payment_intent },
      { idempotencyKey: `refund-${orderId}` }
    );
  }
  return result;
}
