import { Image, Text, View } from "@react-pdf/renderer";
import type { OfferData, Rich } from "./data";
import { Abs, C, CurvedBand, Eyebrow, Icon, NumberCircle, PAGE, PageShell, PageTitle, RichText, Ring, Sparkle, T, caps, type IconName, type Sx } from "./theme";

// Page 5: the PFF Day. The four campus templates are identical here apart from the header and the legal paragraph, so the wording lives in this file.
// Positions are the templates' (pt from the page's top-left). The template prints no footer note or page number on this page.

const SCHEDULE: [time: string, title: string, detail?: string][] = [
  ["9:00–9:30", "Arrive on campus", "Complimentary tea and coffee"],
  ["9:30–10:00", "Check-in", "Pre-task and ID check"],
  ["10:00–11:00", "Session 1", "Introduction and identifying barriers"],
  ["11:00–12:00", "Session 2", "Student support and campus tour"],
  ["12:00–12:30", "Lunch break"],
  ["12:30–14:00", "Session 3", "Research and communication"],
  ["14:00–16:00", "Session 4", "Final reflection and close of the day"],
];
// Line breaks as in the template: "Knowledge of your" misses fitting on one line by under a point, so they are not left to the wrapping.
const ASSESSED: { icon: IconName; lines: string[] }[] = [
  { icon: "clock", lines: ["Punctuality"] }, { icon: "message", lines: ["Communication", "skills"] },
  { icon: "book", lines: ["Knowledge of", "your course"] }, { icon: "people", lines: ["Engagement and", "participation"] },
];
// One entry per printed line: react-pdf balances a paragraph's line lengths instead of filling each line, which moves "late" down to the second line.
const RULES: Rich[][] = [
  [[{ b: "Be on time." }, " Sessions start at 10:00 and late"], ["arrivals can't join — you'd have to"], ["reschedule."]],
  [[{ b: "Pre-task done before you arrive" }, ", or you"], ["can't take part."]],
  [[{ b: "Bring your ID" }, " for the check-in."]],
  [[{ b: "One PFF Day per intake" }, " — come prepared."]],
];
const CLOSING = ["Get in touch and we'll check your documents,", "submit your application and support you all the way", "to enrolment."];

const COL = 340.2, TILE = { w: 98.6, h: 54.7, dx: 105.4, dy: 61.5 }, CARD = { x: 300.5, y: 674.6, w: 243.76, pad: 14.1, label: 93.6 };
const VALUE_W = CARD.w - 2 * CARD.pad - CARD.label;
const inner = PAGE.radius - 0.6;

const s = {
  intro: { fontSize: 9.8, color: C.body, lineHeight: 1.5 },
  table: { borderWidth: 0.6, borderColor: C.line, borderRadius: PAGE.radius },
  row: { flexDirection: "row", height: 46.8 }, rowLine: { borderTopWidth: 0.5, borderTopColor: C.line },
  time: { width: 95.25, flexShrink: 0, backgroundColor: C.pale, paddingLeft: 10.8, paddingTop: 11 },
  timeText: { fontSize: 8.8, fontWeight: 700, color: C.navy, lineHeight: 1.4 },
  slot: { flex: 1, paddingLeft: 11.3, paddingTop: 11 },
  slotTitle: { fontSize: 9, fontWeight: 500, color: C.ink, lineHeight: 1.49 },
  slotBreak: { fontSize: 9, fontWeight: 500, fontStyle: "italic", color: C.body, lineHeight: 1.4 },
  slotDetail: { fontSize: 7.9, color: C.body, lineHeight: 1.4 },
  tile: { width: TILE.w, height: TILE.h, borderRadius: 7.1, backgroundColor: C.pale, paddingLeft: 9.6, paddingTop: 10.2 },
  tileText: { fontSize: 8.4, fontWeight: 700, color: C.navy, lineHeight: 1.25 },
  rule: { flexDirection: "row", minHeight: 13.9, marginBottom: 8.5 },
  ruleText: { fontSize: 8.6, color: C.ink, lineHeight: 1.5 }, ruleLead: { fontWeight: 700, color: C.navy },
  signRule: { width: 134, height: 0.6, backgroundColor: C.navy },
  bandTitle: { fontSize: 19, fontWeight: 700, fontStyle: "italic", color: C.white, lineHeight: 1.15 },
  closing: { fontSize: 8.6, color: C.onNavy, lineHeight: 1.5 },
  card: { backgroundColor: C.white, borderRadius: PAGE.radius, paddingHorizontal: CARD.pad, paddingTop: 10.9, paddingBottom: 11.3 },
  contact: { flexDirection: "row", alignItems: "center", height: 29.8, paddingTop: 0.2 },
  contactLabel: { ...caps(6.6, 0.125), width: CARD.label, flexShrink: 0 },
  contactValue: { fontWeight: 500, color: C.navy },
  legal: { fontSize: 6.3, color: C.onNavyDim, lineHeight: 1.455 },
} satisfies Record<string, Sx>;

// The value column starts where the template's placeholder chip does and is 122pt wide: the email just fits at the template's 8.6pt. A longer host, such as a
// preview deployment's, is set smaller, and below 7pt it is split after the dot or hyphen nearest its middle. Widths are Poppins Medium advances in em, rounded.
const ems = (text: string) => [...text].reduce((w, ch) => w + (/[m@]/i.test(ch) ? 1.04 : /w/i.test(ch) ? 0.83 : /[ijl.:]/.test(ch) ? 0.27 : /[frt1 ]/.test(ch) ? 0.39 : 0.64), 0);
function fitValue(text: string) {
  const size = (lines: string[]) => Math.min(8.6, VALUE_W / Math.max(...lines.map(ems)));
  if (size([text]) >= 7) return { lines: [text], fontSize: size([text]) };
  const mid = text.length / 2, cuts = [...text.matchAll(/[.-]/g)].map((m) => m.index + 1).filter((i) => i < text.length);
  const cut = cuts.sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid))[0] ?? Math.ceil(mid), lines = [text.slice(0, cut), text.slice(cut)];
  return { lines, fontSize: size(lines) };
}

function Contact({ label, value, first = false }: { label: string; value: string; first?: boolean }) {
  const { lines, fontSize } = fitValue(value);
  return <View style={[s.contact, first ? {} : s.rowLine]}>
    <Text style={s.contactLabel}>{label}</Text>
    <View>{lines.map((line) => <Text key={line} style={[s.contactValue, { fontSize, lineHeight: lines.length > 1 ? 1.25 : 1.4 }]}>{line}</Text>)}</View>
  </View>;
}

export function PffDayPage({ data }: { data: OfferData }) {
  const { contact, signature } = data, last = SCHEDULE.length - 1;
  return <PageShell data={data}>
    <Eyebrow>04 · The PFF Day</Eyebrow><PageTitle>Your PFF Day: what to expect</PageTitle>
    <Abs x={PAGE.x} y={124.5} w={472}><Text style={s.intro}>The Prepare for Foundation (PFF) Day is a one-day assessment on campus. It's your chance to show your skills, motivation and readiness for university — beyond your qualifications.</Text></Abs>

    <Abs x={PAGE.x} y={173.2} w={269.3} style={s.table}>
      {SCHEDULE.map(([time, title, detail], i) => <View key={time} style={[s.row, i ? s.rowLine : { height: 46.4 }, detail ? {} : { height: 35 }]}>
        <View style={[s.time, i === 0 ? { borderTopLeftRadius: inner } : {}, i === last ? { borderBottomLeftRadius: inner } : {}]}><Text style={s.timeText}>{time}</Text></View>
        <View style={s.slot}><Text style={detail ? s.slotTitle : s.slotBreak}>{title}</Text>{detail ? <Text style={s.slotDetail}>{detail}</Text> : null}</View>
      </View>)}
    </Abs>

    <Abs x={COL} y={173.8}><Text style={T.h3}>What you're assessed on</Text></Abs>
    {ASSESSED.map(({ icon, lines }, i) => <Abs key={icon} x={COL + (i % 2) * TILE.dx} y={197.5 + Math.floor(i / 2) * TILE.dy} style={s.tile}>
      <Icon name={icon} size={10.5} stroke={2} style={{ marginBottom: 2.2 }} />{lines.map((line) => <Text key={line} style={s.tileText}>{line}</Text>)}
    </Abs>)}

    <Abs x={COL} y={334.1}><Text style={T.h3}>Golden rules</Text></Abs>
    <Abs x={COL} y={358.3}>
      {RULES.map((lines, i) => <View key={i} style={s.rule}>
        <NumberCircle n={i + 1} size={13} fontSize={7} style={{ marginTop: 0.4, marginRight: 7.9 }} />
        <View>{lines.map((line, j) => <RichText key={j} parts={line} style={s.ruleText} bold={s.ruleLead} />)}</View>
      </View>)}
    </Abs>

    {/* The director's sign-off. The PNG is 2:1 with transparent margins: the ink starts 11% in from the left and its underline ends 86% of the way down, where the rule sits. */}
    <Abs x={COL} y={508}>
      <Image src={signature.src} style={{ width: 150, height: 75, marginLeft: -16, marginBottom: -10.5 }} />
      <View style={s.signRule} />
      <Text style={[T.value, { marginTop: 5 }]}>{signature.name}</Text><Text style={[T.label, { marginTop: 1 }]}>{signature.title}</Text>
    </Abs>

    <CurvedBand kind="bowl" top={626.2} />
    <Abs x={68.2} y={657.8}><Ring size={6} /></Abs><Abs x={425.2} y={654.8}><Sparkle size={13} /></Abs>
    <Abs x={PAGE.x} y={675}><Text style={[T.eyebrow, { color: C.sky }]}>Ready to start?</Text></Abs>
    <Abs x={PAGE.x} y={686.5}><Text style={s.bandTitle}>Launch your future</Text><Text style={s.bandTitle}>with Momentum One</Text></Abs>
    <Abs x={PAGE.x} y={739.8}>{CLOSING.map((line) => <Text key={line} style={s.closing}>{line}</Text>)}</Abs>
    <Abs x={CARD.x} y={CARD.y} w={CARD.w} style={s.card}>
      <Contact first label="Phone / WhatsApp" value={contact.phone} /><Contact label="Email" value={contact.email} /><Contact label="Web" value={contact.web} />
    </Abs>
    <Abs x={PAGE.x} y={796.2} w={PAGE.inner}><Text style={s.legal}>{data.legal}</Text></Abs>
  </PageShell>;
}
