import Logo from "@/components/ui/Logo";

export default function Footer() {
  return (
    <footer className="mx-auto max-w-7xl px-6 pb-10 pt-16">
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8 text-sm text-muted-foreground">
        <Logo />
        <p>&copy; {new Date().getFullYear()} Tixly · Make more nights count.</p>
      </div>
    </footer>
  );
}
