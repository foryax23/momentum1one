import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.webp";
import { Button } from "@/components/ui/button";
import { getAccountHome } from "@/lib/accounts.functions";
import { z } from "zod";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/auth")({
  validateSearch: (search) => z.object({ mode: z.enum(["in", "up"]).optional(), email: z.string().email().optional(), setup: z.coerce.boolean().optional(), recovery: z.coerce.boolean().optional() }).parse(search),
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
  const { t } = useI18n();
  const nav = useNavigate();
  const search = Route.useSearch();
  const [mode, setMode] = useState<"in" | "up">(search.mode ?? "in");
  const [email, setEmail] = useState(search.email ?? "");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [hasInviteSession, setHasInviteSession] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [recoverySent, setRecoverySent] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const accountHome = useServerFn(getAccountHome);

  useEffect(() => {
    if (!search.setup) return;
    supabase.auth.getSession().then(({ data }) => setHasInviteSession(Boolean(data.session)));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setHasInviteSession(Boolean(session)));
    return () => data.subscription.unsubscribe();
  }, [search.setup]);

  useEffect(() => {
    if (!search.recovery) return;
    supabase.auth.getSession().then(({ data }) => setHasRecoverySession(Boolean(data.session)));
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setHasRecoverySession(Boolean(session));
    });
    return () => data.subscription.unsubscribe();
  }, [search.recovery]);

  async function sendRecovery(event: React.FormEvent) {
    event.preventDefault(); setBusy(true);
    await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/auth?recovery=true` });
    setBusy(false); setRecoverySent(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (search.recovery) {
      if (!hasRecoverySession || password.length < 8 || password !== confirmPassword) { setBusy(false); toast.error(!hasRecoverySession ? "Open the latest recovery link from your email." : "Use matching passwords with at least 8 characters."); return; }
      const { error } = await supabase.auth.updateUser({ password });
      if (error) { setBusy(false); toast.error(error.message); return; }
      try { const account = await accountHome(); toast.success("Password updated"); nav({ to: account.destination }); } catch { nav({ to: "/auth" }); } finally { setBusy(false); }
      return;
    }
    if (search.setup) {
      if (!hasInviteSession) { setBusy(false); toast.error("Open the latest secure invitation link from your email."); return; }
      const { error } = await supabase.auth.updateUser({ password });
      if (error) { setBusy(false); toast.error(error.message); return; }
      try { const account = await accountHome(); nav({ to: account.destination }); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not open your account."); } finally { setBusy(false); }
      return;
    }
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
      <form onSubmit={showForgot ? sendRecovery : submit} className="relative w-full max-w-md rounded-2xl border border-primary-foreground/15 bg-card p-7 shadow-2xl sm:p-9">
        <div className="flex items-center justify-between gap-3"><a href="/" aria-label="Momentum One home"><img src={logo} alt="Momentum One" width={374} height={320} className="h-16 w-auto" /></a><LanguageSwitcher compact /></div>
        <p className="mt-8 text-xs font-bold uppercase tracking-[.16em] text-teal">{search.recovery || showForgot ? "Account recovery" : search.setup ? "Secure invitation" : mode === "in" ? "Welcome back" : "Student account"}</p>
        <h1 className="mt-2 text-3xl font-bold text-primary">{search.recovery ? t("auth.reset", undefined, "Choose a new password") : showForgot ? t("auth.reset", undefined, "Reset your password") : search.setup ? "Choose your password" : mode === "in" ? t("auth.signin", undefined, "Sign in to continue") : t("auth.track", undefined, "Track your application")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{search.recovery ? "Use the secure link from your latest recovery email." : showForgot ? "Enter your email and we will send a secure recovery link if an account matches." : search.setup ? "Create a private password for your advisor account." : mode === "in" ? "Students, advisors and administrators use the same secure sign-in." : "Use the same email address as your application. We will send a confirmation link before showing private details."}</p>
        {!search.setup && !search.recovery && <><label className="mt-7 block text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">{t("auth.email", undefined, "Email address")}</label>
        <input type="email" required autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 h-13 w-full rounded-lg border border-input bg-card px-4 outline-none focus:border-teal focus:ring-4 focus:ring-teal/15" /></>}
        {!showForgot && <><label className="mt-4 block text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">{t("auth.password", undefined, "Password")}</label>
        <input type="password" required minLength={8} autoComplete={mode === "in" && !search.recovery ? "current-password" : "new-password"} placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 h-13 w-full rounded-lg border border-input bg-card px-4 outline-none focus:border-teal focus:ring-4 focus:ring-teal/15" /></>}
        {search.recovery && <><label className="mt-4 block text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">Confirm new password</label><input type="password" required minLength={8} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-2 h-13 w-full rounded-lg border border-input bg-card px-4 outline-none focus:border-teal focus:ring-4 focus:ring-teal/15" /></>}
        {recoverySent ? <p className="mt-6 rounded-lg bg-secondary p-4 text-sm text-primary">If an account matches that email, a recovery link is on its way. Check your inbox and junk folder.</p> : <Button disabled={busy || (Boolean(search.setup) && !hasInviteSession) || (Boolean(search.recovery) && !hasRecoverySession)} className="mt-6 h-13 w-full text-base font-bold">{busy ? t("auth.wait", undefined, "Please wait") : search.recovery ? "Save new password" : showForgot ? t("auth.send", undefined, "Send recovery link") : search.setup ? "Save password and continue" : mode === "in" ? t("auth.signin", undefined, "Sign in") : t("auth.create", undefined, "Create my account")}</Button>}
        {!search.setup && !search.recovery && !showForgot && mode === "in" && <Button type="button" variant="ghost" onClick={() => setShowForgot(true)} className="mt-2 w-full text-muted-foreground">{t("auth.forgot", undefined, "Forgot password?")}</Button>}
        {showForgot && <Button type="button" variant="ghost" onClick={() => { setShowForgot(false); setRecoverySent(false); }} className="mt-2 w-full text-muted-foreground">{t("auth.back", undefined, "Back to sign in")}</Button>}
        {!search.setup && !search.recovery && !showForgot && <Button type="button" variant="ghost" onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-2 w-full text-muted-foreground">
          {mode === "in" ? t("auth.create", undefined, "Create a student account") : t("auth.existing", undefined, "I already have an account")}
        </Button>}
        {!showForgot && <p className="mt-4 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">Advisor accounts are invitation only. Ask a Momentum One administrator if you need staff access.</p>}
      </form>
    </main>
  );
}
