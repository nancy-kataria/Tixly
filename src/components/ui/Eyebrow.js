import { cn } from "@/lib/cn";

// Small uppercase mint label above headings, e.g. "CURATED FOR YOU".
export default function Eyebrow({ className, children }) {
  return (
    <p className={cn("text-xs font-semibold uppercase tracking-wider text-primary-text", className)}>
      {children}
    </p>
  );
}
