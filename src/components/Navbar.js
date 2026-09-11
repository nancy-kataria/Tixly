"use client"

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import avatar from "../../public/avatar.png";
import { useUser } from "@/context/UserContext";
import Logo from "@/components/ui/Logo";
import { buttonClasses } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export default function Navbar() {
  const { user, signOut } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    if (await signOut()) {
      router.push("/login");
      router.refresh();
    }
  }

  const links = [
    { href: "/", label: "Discover" },
    { href: "/?category=music#events", label: "Music" },
    { href: "/?category=theater#events", label: "Theater" },
    user && { href: "/myProfile", label: "My tickets" },
    user?.role === "organizer"
      ? { href: "/createEvent", label: "Create event" }
      : { href: "/organizers", label: "For organizers" },
  ].filter(Boolean);

  return (
    <header className="sticky top-0 z-40 bg-background/70 backdrop-blur-xl">
      <nav className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-6 px-6">
        <Logo />

        {/* Navigation Links */}
        <div className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn("transition hover:text-foreground", pathname === link.href && "text-foreground")}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <button onClick={handleSignOut} className={buttonClasses({ variant: "ghost", size: "sm" })}>
                Sign out
              </button>
              <Link
                href="/myProfile"
                aria-label="Your profile"
                className="relative size-9 overflow-hidden rounded-full ring-2 ring-surface-border"
              >
                <Image src={user.avatarUrl || avatar} alt="" fill sizes="36px" className="object-cover" />
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className={buttonClasses({ variant: "ghost", size: "sm" })}>
                Sign in
              </Link>
              <Link href="/#events" className={buttonClasses({ size: "sm" })}>
                Get tickets
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
