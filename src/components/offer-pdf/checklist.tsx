import { View, Text } from "@react-pdf/renderer";
import type { OfferData, Rich } from "./data";
import { C, Eyebrow, NumberCircle, PAGE, PageShell, PageTitle, Para, T, type Sx } from "./theme";

// Page 4: the documents checklist and the pre-task rules. The templates print it identically for every campus; only the header carries the student.
type Doc = { title: string; text?: string };
const REQUIRED: Doc[] = [
  { title: "Proof of identity — one of:", text: "UK passport · Overseas passport · EU national ID card (both sides) · UK birth certificate with driving licence (both sides)" },
  { title: "Share code", text: "Required if your passport is not a UK passport" },
  { title: "Proof of address — one of:", text: "Bank statement · Council Tax bill · Utility bill · Government-issued letter · GP or NHS letter. Must be dated within three months of the course start date." },
  { title: "Duolingo English certificate" },
];
const HELPFUL: Doc[] = [{ title: "CV" }, { title: "Qualification certificates", text: "If you have any" }];
const TIP: Rich = [{ b: "Tip:" }, " scan or photograph both sides of ID cards and driving licences, and make sure every page is clear and readable before you send it to us."];
const FACTS: [value: string, label: string][] = [["4", "questions to answer"], ["150", "words per answer"], ["20%", "maximum similarity score"], ["2", "attempts at most"]];
const RULES: Rich[] = [
  [{ b: "Write it in your own words." }, " Any answer with a similarity score above 20% is rejected and must be redone."],
  [{ b: "Know your course." }, " Your answers must include accurate details of the course and its modules."],
  [{ b: "Finish it before your PFF Day." }, " Without a completed pre-task you can't take part and must reschedule."],
  [{ b: "Two chances only." }, " If both attempts miss the standard, the application is rejected for this intake."],
];

const CARD = { left: 273.6, right: 202.66, edge: 0.6, pad: 15.3 }, TICK = { w: 13.9, gap: 9.7 }, TIP_PAD = 14.2, TILE = { w: 116.1, pad: 12.5 }, RULE = { w: 235.27, circle: 17, gap: 9.7 };

const s = {
  cards: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginTop: 17.2 },
  card: { borderWidth: CARD.edge, borderColor: C.line, borderRadius: PAGE.radius, backgroundColor: C.white, paddingTop: 14.7, paddingHorizontal: CARD.pad, paddingBottom: 9.65 },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6.2 },
  pill: { paddingVertical: 2.58, paddingHorizontal: 7.4, borderRadius: 7.7, flexShrink: 0 },
  pillText: { fontSize: 6.6, fontWeight: 700, letterSpacing: 0.924, lineHeight: 1.4 },
  required: { backgroundColor: C.navy },
  // The outline sits outside the pill's 14.4pt height, so both card headings share one line.
  recommended: { backgroundColor: C.pale, borderWidth: 0.5, borderColor: C.line, marginVertical: -0.5 },
  row: { flexDirection: "row", borderTopWidth: 0.5, borderTopColor: C.line, paddingTop: 10.3 },
  tick: { width: TICK.w, height: 11.9, borderWidth: 1, borderColor: C.blue, borderRadius: 2.8, marginTop: 1.9, marginRight: TICK.gap, flexShrink: 0 },
  docTitle: { fontSize: 9.8, fontWeight: 700, color: C.navy, lineHeight: 1.4 },
  docText: { fontSize: 8.5, color: C.body, lineHeight: 1.45 },
  tip: { marginTop: 14.1, backgroundColor: C.pale, borderRadius: PAGE.radius, paddingTop: 14.8, paddingHorizontal: TIP_PAD, paddingBottom: 13.6 },
  tipText: { fontSize: 8.6, color: C.body, lineHeight: 1.55 },
  tiles: { flexDirection: "row", justifyContent: "space-between", marginTop: 17.2 },
  tile: { width: TILE.w, height: 80.8, borderRadius: PAGE.radius, backgroundColor: C.navy, paddingTop: 10.1, paddingHorizontal: TILE.pad, flexShrink: 0 },
  tileValue: { fontSize: 26, fontWeight: 700, fontStyle: "italic", color: C.white, lineHeight: 1.34 },
  tileLabel: { fontSize: 8.2, color: C.onNavy, lineHeight: 1.305 },
  rules: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  rule: { width: RULE.w, flexDirection: "row", alignItems: "flex-start" },
  ruleText: { fontSize: 9.1, color: C.ink, lineHeight: 1.55 },
  lead: { fontWeight: 700, color: C.navy },
} satisfies Record<string, Sx>;

function Checklist({ title, tag, docs, width }: { title: string; tag: "REQUIRED" | "RECOMMENDED"; docs: Doc[]; width: number }) {
  const required = tag === "REQUIRED", text = width - 2 * (CARD.edge + CARD.pad) - TICK.w - TICK.gap;
  return <View style={[s.card, { width }]}>
    <View style={s.cardHead}>
      <Text style={T.h3}>{title}</Text>
      <View style={[s.pill, required ? s.required : s.recommended]}><Text style={[s.pillText, { color: required ? C.white : C.blue }]}>{tag}</Text></View>
    </View>
    {docs.map((doc) => <View key={doc.title} style={[s.row, { paddingBottom: doc.text ? 10.5 : 10.88 }]}>
      <View style={s.tick} />
      <View style={{ flex: 1 }}><Text style={[s.docTitle, { marginBottom: doc.text ? 1.15 : 0 }]}>{doc.title}</Text>{doc.text ? <Para parts={doc.text} width={text} style={s.docText} /> : null}</View>
    </View>)}
  </View>;
}

export function ChecklistPage({ data }: { data: OfferData }) {
  return <PageShell data={data} page={4} note="General admissions requirements — we confirm the exact requirements for your course when you apply.">
    <Eyebrow>03 · Get ready</Eyebrow><PageTitle>Your documents checklist</PageTitle>
    <View style={s.cards}>
      <Checklist title="What you need to send" tag="REQUIRED" docs={REQUIRED} width={CARD.left} />
      <View style={{ width: CARD.right }}>
        <Checklist title="Also helpful" tag="RECOMMENDED" docs={HELPFUL} width={CARD.right} />
        <View style={s.tip}><Para parts={TIP} width={CARD.right - 2 * TIP_PAD} style={s.tipText} bold={s.lead} /></View>
      </View>
    </View>
    <Eyebrow style={{ marginTop: 25.9 }}>Step 3 explained</Eyebrow><PageTitle>Your pre-task: get it right first time</PageTitle>
    <View style={s.tiles}>
      {FACTS.map(([value, label]) => <View key={label} style={s.tile}><Text style={s.tileValue}>{value}</Text><Para parts={label} width={TILE.w - 2 * TILE.pad} style={s.tileLabel} /></View>)}
    </View>
    {[0, 2].map((first) => <View key={first} style={[s.rules, { marginTop: first ? 16.4 : 19.8 }]}>
      {RULES.slice(first, first + 2).map((rule, i) => <View key={first + i} style={s.rule}>
        <NumberCircle n={first + i + 1} size={RULE.circle} fontSize={8} style={{ marginRight: RULE.gap }} />
        <Para parts={rule} width={RULE.w - RULE.circle - RULE.gap} style={s.ruleText} bold={s.lead} box={{ marginTop: 0.7 }} />
      </View>)}
    </View>)}
  </PageShell>;
}
