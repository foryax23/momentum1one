import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { claimStudentApplications, getAccountHome } from "@/lib/accounts.functions";
import { AccountShell } from "@/components/account-shell";
import { IconArrowRight, IconTick } from "@/components/icons";

export const Route = createFileRoute("/_authenticated/student")({
  beforeLoad: async () => {
    const account = await getAccountHome();
    if (account.role !== "user") throw redirect({ to: account.destination });
  },
  head: () => ({ meta: [
    { title: "My application | Momentum One" },
    { name: "description", content: "Track your Momentum One university application." },
    { property: "og:title", content: "My application | Momentum One" },
    { property: "og:description", content: "Track your Momentum One university application." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: StudentDashboard,
});

const STAGES = ["new", "contacted", "applied", "enrolled"];
const COPY: Record<string, [string, string]> = {
  new: ["Application received", "Your options are ready. An advisor will contact you to confirm the next step."],
  contacted: ["Advisor contact", "Your advisor is discussing the course, campus and application details with you."],
  applied: ["Application in progress", "Your details and supporting information are being prepared or reviewed."],
  enrolled: ["Enrolment confirmed", "Your application has reached enrolment. Your advisor will confirm practical course details."],
  lost: ["Application paused", "Contact Momentum One if you would like to review your options again."],
};

function StudentDashboard() {
  const load = useServerFn(claimStudentApplications);
  const query = useQuery({ queryKey: ["student-applications"], queryFn: () => load() });
  const application = query.data?.[0];
  const current = application ? Math.max(0, STAGES.indexOf(application.status)) : 0;
  const [title, next] = COPY[application?.status ?? "new"] ?? COPY.new;
  return <AccountShell eyebrow="Student account" title="My application">
    {query.isLoading ? <DashboardMessage title="Loading your application" text="We are securely linking applications that use your confirmed email address." /> : application ? <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-semibold text-teal">{application.ref_code}</p><h2 className="mt-1 text-2xl font-bold text-primary">{application.selected_course ?? "Course to be confirmed"}</h2><p className="mt-2 text-muted-foreground">{application.study_route ?? "Entry route to be confirmed"} · {application.nearest_campus ?? "Campus to be confirmed"}</p></div><span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold capitalize text-primary">{application.status}</span></div>
        <div className="mt-9 grid gap-0 sm:grid-cols-4">{STAGES.map((stage, index) => <div key={stage} className="relative pb-7 sm:pb-0"><div className="absolute left-4 top-8 h-full w-0.5 bg-border sm:left-8 sm:right-0 sm:top-4 sm:h-0.5 sm:w-auto" /><span className={`relative z-10 grid h-9 w-9 place-items-center rounded-full border-2 ${index <= current ? "border-teal bg-teal text-primary-foreground" : "border-border bg-card text-muted-foreground"}`}>{index < current ? <IconTick size={16} /> : index + 1}</span><p className="ml-13 -mt-8 text-sm font-bold capitalize text-primary sm:ml-0 sm:mt-3">{stage}</p></div>)}</div>
      </section>
      <aside className="rounded-xl bg-primary p-6 text-primary-foreground sm:p-8"><p className="text-xs font-bold uppercase tracking-[.16em] text-gold">Your next step</p><h2 className="mt-3 text-2xl font-bold">{title}</h2><p className="mt-3 leading-relaxed text-primary-foreground/75">{next}</p><a href="https://wa.me/447593855452" target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-2 font-bold text-gold">Message your advisor <IconArrowRight size={18} /></a></aside>
    </div> : <DashboardMessage title="No application found yet" text="Use the same email address you entered in the application. If you have only just confirmed your email, refresh this page once." />}
  </AccountShell>;
}

function DashboardMessage({ title, text }: { title: string; text: string }) { return <div className="mt-8 max-w-2xl rounded-xl border border-border bg-card p-8"><h2 className="text-xl font-bold text-primary">{title}</h2><p className="mt-2 text-muted-foreground">{text}</p></div>; }