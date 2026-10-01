import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { getAccountHome } from "@/lib/accounts.functions";
import { z } from "zod";

export const Route = createFileRoute("/auth")({
  validateSearch: (search) => z.object({ mode: z.enum(["in", "up"]).optional(), email: z.string().email().optional() }).parse(search),
  head: () => ({
    meta: [
      { title: "Account sign in | Momentum One" },
      { name: "description", content: "Sign in to your Momentum One student, advisor or admin account." },
      { property: "og:title", content: "Account sign in | Momentum One" },
      { property: "og:description", content: "Access your Momentum One account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const search = Route.useSearch();
  const [mode, setMode] = useState<"in" | "up">(search.mode ?? "in");
  const [email, setEmail] = useState(search.email ?? "");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const accountHome = useServerFn(getAccountHome);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setBusy(false); toast.error(error.message); return; }
      try {
        const account = await accountHome();
        nav({ to: account.destination });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not open your account.");
      } finally { setBusy(false); }
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/student` } });
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Check your email to confirm your account.");
      setMode("in");
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-primary px-5 py-12">
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] [background-size:48px_48px]" />
      <form onSubmit={submit} className="relative w-full max-w-md rounded-2xl border border-primary-foreground/15 bg-card p-7 shadow-2xl sm:p-9">
        <a href="/" aria-label="Momentum One home"><img src={logo} alt="Momentum One" width={374} height={320} className="h-16 w-auto" /></a>
        <p className="mt-8 text-xs font-bold uppercase tracking-[.16em] text-teal">{mode === "in" ? "Welcome back" : "Student account"}</p>
        <h1 className="mt-2 text-3xl font-bold text-primary">{mode === "in" ? "Sign in to continue" : "Track your application"}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{mode === "in" ? "Students, advisors and administrators use the same secure sign-in." : "Use the same email address as your application. We will send a confirmation link before showing private details."}</p>
        <label className="mt-7 block text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">Email address</label>
        <input type="email" required autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 h-13 w-full rounded-lg border border-input bg-card px-4 outline-none focus:border-teal focus:ring-4 focus:ring-teal/15" />
        <label className="mt-4 block text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">Password</label>
        <input type="password" required minLength={8} autoComplete={mode === "in" ? "current-password" : "new-password"} placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 h-13 w-full rounded-lg border border-input bg-card px-4 outline-none focus:border-teal focus:ring-4 focus:ring-teal/15" />
        <Button disabled={busy} className="mt-6 h-13 w-full text-base font-bold">{busy ? "Please wait" : mode === "in" ? "Sign in" : "Create my account"}</Button>
        <Button type="button" variant="ghost" onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-2 w-full text-muted-foreground">
          {mode === "in" ? "Create a student account" : "I already have an account"}
        </Button>
        <p className="mt-4 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">Advisor accounts are invitation only. Ask a Momentum One administrator if you need staff access.</p>
      </form>
    </main>
  );
}
