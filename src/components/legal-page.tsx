import logo from "@/assets/logo.png";

export function LegalPage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: React.ReactNode }) {
  return <main className="min-h-screen bg-background">
    <header className="border-b border-border bg-card"><div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4"><a href="/" aria-label="Momentum One home"><img src={logo} alt="Momentum One" className="h-10 w-auto" /></a><a href="/" className="text-sm font-bold text-primary">Back home</a></div></header>
    <article className="mx-auto max-w-4xl px-5 py-14 sm:py-20">
      <p className="text-xs font-bold uppercase tracking-[.16em] text-teal">{eyebrow}</p>
      <h1 className="mt-3 text-4xl font-bold text-primary sm:text-6xl">{title}</h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">{intro}</p>
      <div className="legal-copy mt-12 space-y-9 text-foreground">{children}</div>
      <p className="mt-14 border-t border-border pt-6 text-sm text-muted-foreground">MOMENTUM ONE LTD · Company number 16641977 · 6 Harewood Drive, Taverham, Norwich, NR8 6XH · info@momentumone.co.uk · 07383 207062</p>
    </article>
  </main>;
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="text-2xl font-bold text-primary">{title}</h2><div className="mt-3 space-y-3 leading-relaxed text-muted-foreground">{children}</div></section>;
}