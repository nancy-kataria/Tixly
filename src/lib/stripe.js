import "server-only";
import Stripe from "stripe";

let stripe;

// Server-side Stripe client. Test-mode keys (sk_test_...) never move real
// money. Created on first use so builds work without the key set.
export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  stripe ??= new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripe;
}
