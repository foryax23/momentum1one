import { Document, Page, View, Text, Image, StyleSheet, pdf } from "@react-pdf/renderer";
import type { LeadResult } from "@/lib/funnel";
import { campusName, coursesForCampus } from "@/lib/offer-catalog";

const INK = "#063A55", TEAL = "#1F6A8C", GOLD = "#FFB547", ICE = "#F3F8FB", LINE = "#D6E4EA", BODY = "#365462";
const s = StyleSheet.create({
  page: { backgroundColor: "#FFFFFF", color: INK, fontFamily: "Helvetica", padding: 42, fontSize: 9.5 },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: LINE, paddingBottom: 10 },
  logo: { width: 72, height: 60, objectFit: "contain" }, meta: { fontSize: 7, color: TEAL, textAlign: "right", lineHeight: 1.6 },
  eyebrow: { fontSize: 8, color: TEAL, letterSpacing: 2, marginTop: 28 }, h1: { fontFamily: "Helvetica-Bold", fontSize: 27, lineHeight: 1.12, marginTop: 8 },
  h2: { fontFamily: "Helvetica-Bold", fontSize: 18, marginTop: 16, marginBottom: 9 }, lead: { color: BODY, fontSize: 11, lineHeight: 1.55, marginTop: 10 },
  band: { backgroundColor: INK, color: "#FFFFFF", padding: 20, marginTop: 20 }, bandTitle: { fontFamily: "Helvetica-Bold", fontSize: 18 },
  grid: { flexDirection: "row", gap: 8, marginTop: 18 }, stat: { flex: 1, borderWidth: 1, borderColor: LINE, padding: 12, minHeight: 64 },
  label: { fontSize: 6.5, color: TEAL, letterSpacing: 1.2 }, value: { fontFamily: "Helvetica-Bold", fontSize: 10, marginTop: 4, lineHeight: 1.3 },
  card: { borderWidth: 1, borderColor: LINE, padding: 12, marginTop: 8 }, selected: { borderColor: GOLD, borderWidth: 2, backgroundColor: ICE },
  course: { fontFamily: "Helvetica-Bold", fontSize: 10.5 }, small: { color: BODY, fontSize: 8, marginTop: 3, lineHeight: 1.4 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: LINE, paddingVertical: 8 }, num: { width: 28, fontFamily: "Helvetica-Bold", color: GOLD, fontSize: 16 }, rowBody: { flex: 1 }, rowTitle: { fontFamily: "Helvetica-Bold", fontSize: 10 },
  chip: { backgroundColor: ICE, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, fontSize: 7, marginRight: 5, marginTop: 5 },
  footer: { position: "absolute", left: 42, right: 42, bottom: 24, borderTopWidth: 1, borderTopColor: LINE, paddingTop: 7, flexDirection: "row", justifyContent: "space-between", color: BODY, fontSize: 6.5 },
  callout: { borderLeftWidth: 4, borderLeftColor: GOLD, backgroundColor: ICE, padding: 12, marginTop: 14, lineHeight: 1.5 },
});

function Header({ lead, page }: { lead: LeadResult; page: number }) {
  return <View style={s.top} fixed><Image src={`${window.location.origin}/logo.png`} style={s.logo} /><Text style={s.meta}>{lead.ref_code}{"\n"}PERSONALISED STUDENT OFFER · {String(page).padStart(2, "0")}/05</Text></View>;
}
function Footer({ campus }: { campus: string }) { return <View style={s.footer} fixed><Text>MOMENTUM ONE · BUILDING MOMENTUM FOR YOUR FUTURE</Text><Text>{campus.toUpperCase()} CAMPUS</Text></View>; }
const PFF = [
  ["9:00 to 9:30", "Arrive on campus", "Complimentary tea and coffee"], ["9:30 to 10:00", "Check-in", "Pre-task and ID check"],
  ["10:00 to 11:00", "Session 1", "Introduction and identifying barriers"], ["11:00 to 12:00", "Session 2", "Student support and campus tour"],
  ["12:00 to 12:30", "Lunch break", ""], ["12:30 to 14:00", "Session 3", "Research and communication"], ["14:00 to 16:00", "Session 4", "Final reflection and close of the day"],
] as const;

export function OfferDocument({ lead }: { lead: LeadResult; origin?: string }) {
  const campus = campusName(lead.nearest_campus), courses = coursesForCampus(lead.nearest_campus);
  const chosen = courses.find((c) => c.title === lead.selected_course && c.route === lead.study_route) ?? courses[0];
  const issued = new Date(lead.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const facts = [["STUDENT", lead.full_name], ["COURSE", chosen?.title ?? "Course to be confirmed"], ["ENTRY ROUTE", lead.study_route ?? "Foundation Year"], ["NEXT INTAKE", lead.intake ?? "Dates TBA"]];
  return <Document title={`Momentum One Offer ${lead.ref_code}`} author="Momentum One">
    <Page size="A4" style={s.page}><Header lead={lead} page={1} />
      <Text style={s.eyebrow}>STUDY IN THE UK · PERSONALISED COURSE PATHWAY</Text><Text style={s.h1}>Launch your degree in {campus}</Text>
      <Text style={s.lead}>Prepared for {lead.full_name}. Your selected pathway is {chosen?.title ?? "your chosen degree"} with {lead.study_route ?? "Foundation Year"}, subject to application review and assessment.</Text>
      <View style={s.grid}>{facts.map(([label, value]) => <View key={label} style={s.stat}><Text style={s.label}>{label}</Text><Text style={s.value}>{value}</Text></View>)}</View>
      <View style={s.band}><Text style={s.bandTitle}>A university degree that fits your life</Text><Text style={{ marginTop: 8, lineHeight: 1.55 }}>Flexible study patterns · UK honours degree · Personal application support · Foundation route available</Text></View>
      <Text style={s.h2}>Your place starts with one conversation</Text><Text style={s.lead}>We guide you from application to enrolment, step by step. Issued {issued} for reference {lead.ref_code}.</Text>
      <View style={s.callout}><Text style={s.course}>Important</Text><Text style={s.small}>This personalised pathway is not a confirmed university admission offer. Eligibility is confirmed after document review and the required assessment.</Text></View><Footer campus={campus} />
    </Page>
    <Page size="A4" style={s.page}><Header lead={lead} page={2} /><Text style={s.eyebrow}>01 · THE COURSES</Text><Text style={s.h1}>Your course options in {campus}</Text><Text style={s.lead}>Your chosen course is highlighted. Study patterns are based on the current campus information and may change before enrolment.</Text>
      {courses.map((course) => <View key={course.id} style={[s.card, course.id === chosen?.id ? s.selected : {}]}><Text style={s.label}>{course.university.toUpperCase()}</Text><Text style={s.course}>{course.title}</Text><Text style={s.small}>{course.route} · {course.patterns.join(" · ")}</Text></View>)}<Footer campus={campus} />
    </Page>
    <Page size="A4" style={s.page}><Header lead={lead} page={3} /><Text style={s.eyebrow}>02 · HOW TO APPLY</Text><Text style={s.h1}>Your journey to enrolment</Text>
      {["Apply with Momentum One|Send your documents. We check everything and submit your application.", "Application check|Admissions reviews your documents and invites you to the PFF pre-task.", "Complete your pre-task|Answer 4 questions of 150 words each. You can resubmit once if needed.", `Attend your PFF Day|A one-day assessment at the ${campus} campus.`, "Get your offer and enrol|Pass the assessment, complete the checks and receive enrolment confirmation."].map((item, i) => { const [title, body] = item.split("|"); return <View key={item} style={s.row}><Text style={s.num}>{i + 1}</Text><View style={s.rowBody}><Text style={s.rowTitle}>{title}</Text><Text style={s.small}>{body}</Text></View></View>; })}
      <View style={s.callout}><Text style={s.course}>Key dates</Text><Text style={s.small}>Next intake: To be confirmed · PFF days: To be confirmed. Start early so there is time to complete and, if needed, resubmit your pre-task.</Text></View><Footer campus={campus} />
    </Page>
    <Page size="A4" style={s.page}><Header lead={lead} page={4} /><Text style={s.eyebrow}>03 · GET READY</Text><Text style={s.h1}>Your documents checklist</Text>
      {["Proof of identity", "Share code if your passport is not British", "Proof of address dated within three months of the course start", "Duolingo English certificate", "CV, if available", "Qualification certificates, if available"].map((item, i) => <View key={item} style={s.row}><Text style={s.num}>{i < 4 ? "□" : "○"}</Text><Text style={s.rowTitle}>{item}</Text></View>)}
      <Text style={s.h2}>Your pre-task: get it right first time</Text><View style={s.grid}>{[["4", "questions"], ["150", "words each"], ["20%", "maximum similarity"], ["2", "attempts at most"]].map(([v, l]) => <View key={v} style={s.stat}><Text style={[s.value, { fontSize: 18 }]}>{v}</Text><Text style={s.small}>{l}</Text></View>)}</View>
      <View style={s.callout}><Text style={s.small}>Write in your own words. Include accurate course details. Finish before PFF Day. Scan both sides of identity documents clearly.</Text></View><Footer campus={campus} />
    </Page>
    <Page size="A4" style={s.page}><Header lead={lead} page={5} /><Text style={s.eyebrow}>04 · THE PFF DAY</Text><Text style={s.h1}>Your PFF Day: what to expect</Text><Text style={s.lead}>A one-day campus assessment of your skills, motivation and readiness for university.</Text>
      {PFF.map(([time, title, body]) => <View key={time} style={s.row}><Text style={[s.rowTitle, { width: 95 }]}>{time}</Text><View style={s.rowBody}><Text style={s.rowTitle}>{title}</Text>{body && <Text style={s.small}>{body}</Text>}</View></View>)}
      <Text style={s.h2}>Golden rules</Text><View style={{ flexDirection: "row", flexWrap: "wrap" }}>{["Be on time", "Complete the pre-task", "Bring your ID", "One PFF Day per intake"].map((rule) => <Text key={rule} style={s.chip}>{rule}</Text>)}</View>
      <View style={s.band}><Text style={s.bandTitle}>Launch your future with Momentum One</Text><Text style={{ marginTop: 7, lineHeight: 1.5 }}>We will check your documents, submit your application and support you all the way to enrolment.</Text></View>
      <Text style={[s.small, { marginTop: 12 }]}>Momentum One is an independent student recruitment agency. Course details are provided by partner colleges and awarding universities. Dates and timetables are to be confirmed and may change. Foundation Year admission depends on meeting all requirements and passing the PFF Day.</Text><Footer campus={campus} />
    </Page>
  </Document>;
}

export async function downloadOffer(lead: LeadResult) {
  const blob = await pdf(<OfferDocument lead={lead} />).toBlob();
  const url = URL.createObjectURL(blob), a = document.createElement("a");
  const campus = campusName(lead.nearest_campus).replace(/\s+/g, "-");
  const course = (lead.selected_course ?? "Course").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
  a.href = url; a.download = `Momentum-One-${lead.ref_code}-${campus}-${course}.pdf`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 2000);
}