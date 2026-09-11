import { cn } from "@/lib/cn";

const VARIANTS = {
  primary:
    "bg-primary text-primary-foreground shadow-[0_12px_30px_-14px_var(--ring)] hover:brightness-105",
  secondary: "glass-strong text-foreground hover:bg-white",
  outline: "border border-border bg-surface-strong text-foreground hover:bg-white",
  ghost: "text-foreground hover:bg-secondary",
  danger: "border border-destructive/30 bg-surface-strong text-destructive hover:bg-destructive/10",
};

const SIZES = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

// Classes for anything styled as a button, e.g. a Link:
//   <Link className={buttonClasses({ variant: "outline" })}>
export function buttonClasses({ variant = "primary", size = "md", className } = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition",
    "disabled:pointer-events-none disabled:opacity-60",
    VARIANTS[variant],
    SIZES[size],
    className
  );
}

export default function Button({ variant, size, className, type = "button", ...props }) {
  return <button type={type} className={buttonClasses({ variant, size, className })} {...props} />;
}
