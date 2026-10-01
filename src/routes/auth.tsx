import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Staff sign in | Momentum One" },
      { name: "description", content: "Momentum One staff sign in to the leads dashboard." },
      { property: "og:title", content: "Staff sign in | Momentum One" },
      { property: "og:description", content: "Momentum One staff sign in." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      nav({ to: "/admin" });
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin` } });
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Check your email to confirm your account.");
      setMode("in");
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-ruled px-5">
      <form onSubmit={submit} className="w-full max-w-sm rounded-sm border-t-4 border-teal bg-stone p-7 shadow-paper">
        <img src={logo} alt="Momentum One" width={374} height={320} className="mx-auto h-24 w-auto" />
        <h1 className="mt-4 text-center text-2xl font-bold">{mode === "in" ? "Staff sign in" : "Create staff account"}</h1>
        <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-6 w-full rounded-xl border border-input bg-card px-4 py-3 outline-none focus:border-primary" />
        <input type="password" required minLength={8} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-3 w-full rounded-xl border border-input bg-card px-4 py-3 outline-none focus:border-primary" />
        <button disabled={busy} className="mt-5 w-full rounded-xl bg-ink py-3 font-display font-semibold text-primary-foreground disabled:opacity-60">
          {busy ? "…" : mode === "in" ? "Sign in" : "Sign up"}
        </button>
        <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground">
          {mode === "in" ? "Need an account? Sign up" : "Have an account? Sign in"}
        </button>
      </form>
    </main>
  );
}
