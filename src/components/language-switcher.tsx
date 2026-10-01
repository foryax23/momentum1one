import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n, type Locale } from "@/lib/i18n";

const options: { value: Locale; label: string; name: string }[] = [
  { value: "en", label: "EN", name: "English" },
  { value: "ro", label: "RO", name: "Română" },
  { value: "es", label: "ES", name: "Español" },
];

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n();
  return <div role="group" aria-label={t("language")} className="flex shrink-0 items-center rounded-full border border-border bg-card/90 p-0.5 shadow-sm backdrop-blur">
    {options.map((option) => <Button key={option.value} type="button" variant="ghost" size="sm" title={option.name} aria-pressed={locale === option.value} onClick={() => setLocale(option.value)} className={cn("h-7 min-w-8 rounded-full px-2 text-[10px] font-bold", locale === option.value ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" : "text-muted-foreground", compact && "min-w-7 px-1.5")}>{option.label}</Button>)}
  </div>;
}