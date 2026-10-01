import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import logo from "@/assets/logo.png";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { IconDoor } from "@/components/icons";
import { LanguageSwitcher } from "@/components/language-switcher";

export function AccountShell({ title, eyebrow, children, actions }: { title: string; eyebrow: string; children: ReactNode; actions?: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  return <main className="min-h-screen bg-secondary/45">
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link to="/"><img src={logo} alt="Momentum One" className="h-10 w-auto" /></Link>
        <div className="flex items-center gap-2"><LanguageSwitcher compact />{actions}<Button variant="outline" size="icon" aria-label="Sign out" onClick={signOut}><IconDoor size={18} /></Button></div>
      </div>
    </header>
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
      <p className="text-xs font-bold uppercase tracking-[.18em] text-teal">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-bold text-primary sm:text-4xl">{title}</h1>
      {children}
    </div>
  </main>;
}