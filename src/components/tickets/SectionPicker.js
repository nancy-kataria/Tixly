"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Minus, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";

const MAX_PER_ORDER = 8; // matches buy_tickets() in the database

function availabilityLabel(count) {
  return count <= 20 ? `Only ${count} left` : `${count.toLocaleString("en-US")} left`;
}

// "Choose your tickets": pick a section and a quantity, then buy.
// sections: rows from the section_availability view.
export default function SectionPicker({ sections, userId, hasStarted }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isBuying, setIsBuying] = useState(false);
  const [error, setError] = useState("");
  const [bought, setBought] = useState(null); // { quantity, sectionName }

  const selected = sections.find((section) => section.id === selectedId);
  const maxQuantity = selected ? Math.min(MAX_PER_ORDER, selected.available_count) : 1;

  const selectSection = (section) => {
    setSelectedId(section.id);
    setQuantity((current) => Math.max(1, Math.min(current, MAX_PER_ORDER, section.available_count)));
    setError("");
    setBought(null);
  };

  const handleBuy = async () => {
    if (!userId) {
      router.push("/login");
      return;
    }
    setIsBuying(true);
    setError("");
    const { error } = await createClient().rpc("buy_tickets", {
      p_section_id: selected.id,
      p_quantity: quantity,
    });
    setIsBuying(false);
    if (error) {
      setError(error.message);
      return;
    }
    setBought({ quantity, sectionName: selected.name });
    setSelectedId(null);
    setQuantity(1);
    router.refresh();
  };

  if (sections.length === 0) {
    return <p className="text-sm text-muted-foreground">Tickets aren&apos;t on sale yet.</p>;
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => {
          const isSelected = section.id === selectedId;
          const isSoldOut = section.available_count === 0;
          const details = [section.description, isSoldOut ? "Sold out" : availabilityLabel(section.available_count)];

          return (
            <div
              key={section.id}
              className={cn(
                "flex flex-col rounded-panel border bg-surface-strong p-5 transition",
                isSelected ? "border-primary bg-secondary/60 ring-2 ring-primary/30" : "border-surface-border"
              )}
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{section.name}</p>
              <p className="mt-2 text-3xl tracking-tight">{formatPrice(section.price_cents)}</p>
              <p className="mt-1 flex-1 text-sm text-muted-foreground">{details.filter(Boolean).join(" · ")}</p>
              <Button
                variant="outline"
                className="mt-5 w-full"
                disabled={isSoldOut || hasStarted}
                aria-pressed={isSelected}
                onClick={() => selectSection(section)}
              >
                {isSelected ? (
                  <>
                    <Check className="size-4" aria-hidden /> Selected
                  </>
                ) : isSoldOut ? (
                  "Sold out"
                ) : (
                  "Select"
                )}
              </Button>
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="glass-strong mt-5 flex flex-wrap items-center justify-between gap-4 rounded-panel p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center rounded-full border border-border bg-white">
              <button
                type="button"
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                disabled={quantity <= 1}
                aria-label="One fewer ticket"
                className="grid size-10 place-items-center rounded-full transition hover:bg-secondary disabled:opacity-40"
              >
                <Minus className="size-4" aria-hidden />
              </button>
              <span className="w-8 text-center font-medium" aria-live="polite">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((current) => Math.min(maxQuantity, current + 1))}
                disabled={quantity >= maxQuantity}
                aria-label="One more ticket"
                className="grid size-10 place-items-center rounded-full transition hover:bg-secondary disabled:opacity-40"
              >
                <Plus className="size-4" aria-hidden />
              </button>
            </div>
            <div>
              <p className="font-medium">
                {quantity} × {selected.name}
              </p>
              <p className="text-xs text-muted-foreground">Up to {maxQuantity} per order</p>
            </div>
          </div>
          <Button size="lg" onClick={handleBuy} disabled={isBuying}>
            {isBuying ? "Buying…" : `Buy · ${formatPrice(selected.price_cents * quantity)}`}
          </Button>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-panel bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {bought && (
        <p role="status" className="mt-4 rounded-panel bg-secondary px-4 py-3 text-sm text-secondary-foreground">
          You got {bought.quantity} {bought.sectionName} {bought.quantity === 1 ? "ticket" : "tickets"}.{" "}
          <Link href="/myProfile" className="font-semibold underline">
            See them in My tickets
          </Link>
        </p>
      )}
    </div>
  );
}
