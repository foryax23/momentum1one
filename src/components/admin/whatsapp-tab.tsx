import { useMemo, type ReactNode } from "react";
import { whatsappWelcome, type LeadRow } from "@/lib/lead-metrics";
import { fmtInt, fmtPct, Panel } from "./chart-kit";
import { LoadLimitNotice } from "./parts";
import { StatTile } from "./stat-tile";

/**
 * The WhatsApp tab: what happened to the welcome messages (from the loaded leads), then the live queue and the connection
 * check. The two live panels come from whatsapp-admin.tsx as they are; the wrappers only drop their outer margin and give
 * the queue's card the dashboard's panel heading (eyebrow, display italics), so they sit in the grid like every other card.
 */
export function WhatsAppTab({ leads, total, queue, health }: {
  /** Leave out while the leads are loading or failed: the live panels do not depend on them. */ leads?: readonly LeadRow[] | undefined;
  /** How many leads exist in all, when the server said. */ total?: number | undefined;
  /** <WhatsAppQueue /> */ queue: ReactNode;
  /** <WhatsAppHealth /> */ health: ReactNode;
}) {
  const welcome = useMemo(() => (leads ? whatsappWelcome(leads) : null), [leads]);
  const waiting = welcome ? welcome.pending + welcome.sending + welcome.other : 0;
  return (
    <div className="grid gap-4">
      {leads && <LoadLimitNotice loaded={leads.length} total={total}>The welcome-message numbers count those leads only. The live queue and the connection check below are not affected.</LoadLimitNotice>}
      {welcome && leads && (
        <section aria-label="Welcome messages" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="WhatsApp opt-ins" value={fmtInt(welcome.optedIn)} meter={leads.length ? welcome.optedIn / leads.length : 0}
            footnote={leads.length ? `${fmtPct(welcome.optedIn / leads.length)} of ${fmtInt(leads.length)} leads said WhatsApp is fine` : "No leads yet"} />
          <StatTile label="Welcomes sent" value={fmtInt(welcome.sent)} meter={welcome.sentShare}
            footnote={`${fmtPct(welcome.sentShare)} of opt-ins${waiting ? ` · ${fmtInt(waiting)} not sent yet` : ""}`} />
          <StatTile label="Waiting for Meta" value={fmtInt(welcome.awaiting_template)} footnote="Held until Meta approves the welcome message" />
          <StatTile label="Welcomes failed" value={fmtInt(welcome.failed)} footnote={welcome.failed ? "Open the lead to resend the welcome" : "Nothing to resend"} />
        </section>
      )}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* the eyebrow sits in the room the extra top padding leaves, so the queue's card opens like every other panel */}
        <div className="relative grid min-w-0 lg:col-span-7 [&>section]:mt-0 [&>section]:p-5 [&>section]:pt-10 sm:[&>section]:p-6 sm:[&>section]:pt-11 [&_h2]:text-lg [&_h2]:italic [&_h2]:leading-snug [&_h2]:text-primary sm:[&_h2]:text-xl">
          <p className="pointer-events-none absolute left-5 top-5 text-[11px] font-bold uppercase tracking-[.14em] text-teal sm:left-6 sm:top-6">Live queue</p>
          {queue}
        </div>
        <div className="grid min-w-0 content-start lg:col-span-5">
          <Panel eyebrow="Connection" title="Is WhatsApp reaching us?" hint="Checked every 30 seconds: the link to the business number, the welcome message's approval and the bot's replies.">
            <div className="[&>div]:mt-0">{health}</div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
