import { ChevronDown, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useI18n, type Locale } from "@/lib/i18n";

const options: { value: Locale; label: string; name: string }[] = [
  { value: "en", label: "EN", name: "English" },
  { value: "ro", label: "RO", name: "Română" },
  { value: "es", label: "ES", name: "Español" },
];

export function LanguageSwitcher({ compact = false, className }: { compact?: boolean; className?: string }) {
  const { locale, setLocale, t } = useI18n();
  return <div role="group" aria-label={t("language")} className={cn("flex shrink-0 items-center rounded-full border border-border bg-card p-0.5 shadow-sm", className)}>
    {options.map((option) => <Button key={option.value} type="button" variant="ghost" size="sm" title={option.name} aria-pressed={locale === option.value} onClick={() => setLocale(option.value)} className={cn("h-7 min-w-8 rounded-full px-2 text-[10px] font-bold", locale === option.value ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" : "text-muted-foreground", compact && "min-w-7 px-1.5")}>{option.label}</Button>)}
  </div>;
}

/** Phone header: one button showing the current language, opening the list of three. */
export function LanguageMenu({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();
  const current = options.find((option) => option.value === locale);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label={`${t("language", undefined, "Language")}: ${current?.name ?? locale}`} className={cn("inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-xs font-bold text-primary shadow-sm outline-none transition-[scale,border-color] duration-160 ease-out focus-visible:border-primary active:scale-[0.97]", className)}>
          <Globe size={15} strokeWidth={1.75} aria-hidden />{current?.label ?? locale.toUpperCase()}<ChevronDown size={14} className="text-muted-foreground" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuRadioGroup value={locale} onValueChange={(value) => setLocale(value as Locale)}>
          {options.map((option) => <DropdownMenuRadioItem key={option.value} value={option.value} className="py-2.5 text-sm font-semibold">{option.name}</DropdownMenuRadioItem>)}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
