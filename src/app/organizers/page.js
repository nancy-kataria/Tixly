import Link from "next/link";
import { CalendarPlus, Tags, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import BecomeOrganizerButton from "@/components/BecomeOrganizerButton";
import Card from "@/components/ui/Card";
import Eyebrow from "@/components/ui/Eyebrow";
import { buttonClasses } from "@/components/ui/Button";

const PERKS = [
  { icon: CalendarPlus, text: "Create events at your venues in a couple of minutes." },
  { icon: Tags, text: "Split your venue into sections, each with its own price and capacity." },
  { icon: Users, text: "Fans buy from you, then resell or transfer safely on Tixly." },
];

// Entry point for people who want to sell tickets: sign in, then one click
// to become an organizer.
export default async function OrganizersPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  let role = null;
  if (userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();
    role = profile?.role;
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Card className="p-8 sm:p-10">
        <Eyebrow>For organizers</Eyebrow>
        <h1 className="mt-2 text-4xl font-medium tracking-tight sm:text-5xl">Sell tickets on Tixly</h1>

        <ul className="mt-8 space-y-4">
          {PERKS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary-text">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="pt-2 text-muted-foreground">{text}</span>
            </li>
          ))}
        </ul>

        <div className="mt-10 border-t border-border pt-8">
          {!userId && (
            <>
              <p className="mb-4 text-sm text-muted-foreground">
                Sign in first. You&apos;ll come straight back here to finish.
              </p>
              <GoogleSignInButton next="/organizers" variant="primary" />
            </>
          )}

          {userId && role !== "organizer" && <BecomeOrganizerButton />}

          {role === "organizer" && (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="font-medium text-primary-text">You&apos;re an organizer.</p>
              <Link href="/createEvent" className={buttonClasses()}>
                Create an event
              </Link>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
