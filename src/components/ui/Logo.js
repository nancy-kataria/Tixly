import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="Tixly home">
      <span className="grid size-9 place-items-center rounded-[0.7rem] bg-foreground text-lg font-semibold text-background">
        T
      </span>
      <span className="text-2xl font-medium tracking-tight">Tixly</span>
    </Link>
  );
}
