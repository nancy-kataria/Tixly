import Link from "next/link";
import { cn } from "@/lib/cn";

// Pill-shaped filter link, highlighted when active.
export default function Chip({ href, active = false, children }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-full px-3.5 py-1.5 text-sm transition",
        active
          ? "bg-primary text-primary-foreground shadow-[0_8px_20px_-10px_var(--ring)]"
          : "border border-surface-border bg-surface-strong hover:bg-white"
      )}
    >
      {children}
    </Link>
  );
}
