import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CartView from "@/components/cart/CartView";

export default async function CartPage({ searchParams }) {
  const { checkout } = await searchParams;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  // src/proxy.js already redirects signed-out users; this is a fallback.
  if (!userId) redirect("/login");

  // Tickets held for this user right now.
  const { data: tickets } = await supabase
    .from("tickets")
    .select("id, number, status, price_cents, list_price_cents, held_until, section:ticket_sections(name), event:events(id, name, starts_at)")
    .eq("held_by", userId)
    .gt("held_until", new Date().toISOString());

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <CartView tickets={tickets ?? []} checkoutCancelled={checkout === "cancelled"} />
    </div>
  );
}
