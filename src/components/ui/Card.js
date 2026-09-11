import { cn } from "@/lib/cn";

// Frosted-glass panel used for most surfaces.
export default function Card({ as: Tag = "div", strong = false, className, ...props }) {
  return (
    <Tag className={cn(strong ? "glass-strong" : "glass", "rounded-card", className)} {...props} />
  );
}
