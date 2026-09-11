import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import Card from "@/components/ui/Card";

export default async function LoginPage({ searchParams }) {
  // Already signed in? Nothing to do here.
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) redirect("/");

  const { error } = await searchParams;

  return (
    <div className="grid min-h-[70vh] place-items-center px-6 py-16">
      <Card strong className="w-full max-w-md p-8">
        <h1 className="text-4xl font-medium tracking-tight">Welcome to Tixly</h1>
        <p className="mt-2 text-muted-foreground">
          Sign in to buy tickets, resell them, and keep them all in one place.
        </p>
        {error && (
          <p role="alert" className="mt-6 rounded-panel bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Sign-in didn&apos;t complete. Please try again.
          </p>
        )}
        <div className="mt-8">
          <GoogleSignInButton />
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          New to Tixly? Signing in with Google creates your account.
        </p>
      </Card>
    </div>
  );
}
