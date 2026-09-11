import { cn } from "@/lib/cn";

export const inputClasses =
  "h-11 w-full rounded-xl border border-input bg-surface-strong px-4 text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40";

export function Label({ className, ...props }) {
  return <label className={cn("mb-1.5 block text-sm font-medium", className)} {...props} />;
}

export default function Input({ className, ...props }) {
  return <input className={cn(inputClasses, className)} {...props} />;
}
