import { Text, View } from "@react-pdf/renderer";
import type { CampusKey, OfferData, Rich } from "./data";
import { C, Eyebrow, NumberCircle, PAGE, PageShell, PageTitle, RichText, Sparkle, T, caps, type Sx } from "./theme";

// Page 3: "Can I apply?" and the five-step journey beside the key dates. On the "few" layout (Newcastle, Luton) "Can I apply?" sits on page 2,
// so this page opens with the journey, set larger and with more air between the steps. Wording is the client's template wording.

// react-pdf balances the lengths of a paragraph's lines where the templates' browser layout fills each line before starting the next, so the same words
// break in other places and a line can run past its column. The copy therefore carries the templates' line ends in place of the space: "|" on the grid
// layout, "/" on the few layout. The sentence that names the campus ends its first line after the word each template ends it on (Luton follows Newcastle).
const ATTEND_BREAK: Record<CampusKey, "campus." | "You" | "one"> = { Manchester: "You", Derby: "one", Sunderland: "You", Newcastle: "campus.", Luton: "campus." };
type Step = { title: string; body: Rich; status?: string };
function journey(campus: CampusKey, few: boolean): Step[] {
  const after = (word: (typeof ATTEND_BREAK)[CampusKey]) => ATTEND_BREAK[campus] === word ? (few ? "/" : "|") : " ";
  return [
    { title: "Apply with Momentum One", body: ["Send us your documents. We check everything with/you|and submit your application to the college."], status: "Learner Application" },
    { title: "Application check", body: ["The Admissions team reviews your documents./When|everything is in order, you receive an ", { b: "email/inviting you|to complete the PFF pre-task" }, "."], status: "Ready for PFF Pre-task Activity" },
    { title: "Complete your pre-task", body: ["Answer ", { b: "4 questions of 150 words each" }, ". Once/Admissions|approves your answers, you can book/your PFF Day."], status: "Ready 4 PFF" },
    { title: "Attend your PFF Day", body: [`A one-day assessment at the ${campus} campus.${after("campus.")}You${after("You")}get `, { b: `one${after("one")}attempt per intake` }, " — see page 5."] },
    { title: "Get your offer and enrol", body: ["Pass the PFF Day and the Admissions team/processes|your documents and ", { b: "confirms your/enrolment" }, "."] },
  ];
}
function splitLines(parts: Rich, few: boolean): Rich[] {
  const [mark, other] = few ? ["/", "|"] : ["|", "/"], lines: Rich[] = [[]];
  for (const part of parts) {
    const bold = typeof part !== "string";
    (bold ? part.b : part).split(other).join(" ").split(mark).forEach((text, i) => {
      if (i) lines.push([]);
      if (text) lines[lines.length - 1]?.push(bold ? { b: text } : text);
    });
  }
  return lines;
}
/** A paragraph set line by line; `style` goes on every line, `box` on the paragraph. */
function Lines({ parts, few = false, style, box }: { parts: Rich; few?: boolean; style: Sx; box?: Sx }) {
  return <View style={box ?? {}}>{splitLines(parts, few).map((line, i) => <RichText key={i} parts={line} style={style} />)}</View>;
}

// Step metrics per layout. `trim` is the half-leading react-pdf leaves under the last body line; taking it back keeps the templates' spacing below a step with or without a status chip.
const STEP = {
  grid: { top: 11.6, circle: 29.8, number: 11.5, gutter: 15.6, titleTop: 2.2, title: 11, bodyTop: 3.3, body: 8.8, pitch: 1.5, trim: 0.44, chipTop: 4.54, gap: 15.3 },
  few: { top: 22.9, circle: 35.4, number: 13, gutter: 15.6, titleTop: 2.3, title: 12.5, bodyTop: 4.8, body: 9.4, pitch: 1.55, trim: 0.7, chipTop: 6.8, gap: 35.4 },
};
const COLUMN = { steps: 300.2, side: 170.1 };
/** White at 18% on navy, as a solid colour. */
const DIVIDER = "#335d74";

const s = {
  panel: { marginTop: 8.7, borderRadius: PAGE.radius, backgroundColor: C.pale, paddingTop: 12.4, paddingBottom: 11.5, paddingLeft: 91.9, paddingRight: 15.3 },
  yes: { position: "absolute", left: 15.3, top: 9.2, fontSize: 28, fontWeight: 700, fontStyle: "italic", color: C.blue, lineHeight: 1.4 },
  answer: { fontSize: 8.8, color: C.ink, lineHeight: 1.5 },
  strip: { flexDirection: "row", borderRadius: 7.1, paddingVertical: 8.4, paddingHorizontal: 11.4 },
  stripLabel: { fontSize: 8.6, fontWeight: 700, lineHeight: 1.4, marginRight: 8.5 },
  stripText: { flex: 1, fontSize: 8.6, lineHeight: 1.4 },
  columns: { flexDirection: "row", justifyContent: "space-between" },
  stepTitle: { fontWeight: 700, color: C.navy, lineHeight: 1.4 },
  line: { position: "absolute", width: 0.9, bottom: 0, backgroundColor: C.line },
  chip: { alignSelf: "flex-start", borderRadius: 7.6, borderWidth: 0.5, borderColor: C.line, backgroundColor: C.pale, paddingTop: 2, paddingBottom: 2.1, paddingHorizontal: 7.3 },
  chipText: { fontSize: 7.2, fontWeight: 500, color: C.blue, letterSpacing: 0.29, lineHeight: 1.4 },
  dates: { borderRadius: PAGE.radius, backgroundColor: C.navy, paddingTop: 17.6, paddingBottom: 14.8, paddingHorizontal: 17 },
  datesTitle: { fontSize: 13, fontWeight: 700, fontStyle: "italic", color: C.white, lineHeight: 1.4, marginBottom: 5.9 },
  date: { paddingTop: 8.7, paddingBottom: 8.8 },
  dateRule: { paddingTop: 8.2, borderTopWidth: 0.5, borderTopColor: DIVIDER },
  dateValue: { marginTop: -0.44, fontWeight: 700, color: C.white, lineHeight: 1.25 },
  datesNote: { fontSize: 6.8, color: C.onNavy, lineHeight: 1.5 },
  early: { marginTop: 14.1, borderRadius: PAGE.radius, borderWidth: 0.6, borderColor: C.line, paddingTop: 14.7, paddingBottom: 13.5, paddingHorizontal: 14.1 },
  earlyText: { fontSize: 8.6, color: C.body, lineHeight: 1.55 },
} satisfies Record<string, Sx>;

function Strip({ label, text, fill, color, style }: { label: string; text: string; fill: string; color: string; style?: Sx }) {
  return <View style={[s.strip, { backgroundColor: fill }, style ?? {}]}><Text style={[s.stripLabel, { color }]}>{label}</Text><Text style={[s.stripText, { color }]}>{text}</Text></View>;
}

function CanApply({ year1Note }: { year1Note: boolean }) {
  return <>
    <View style={s.panel}>
      <Text style={s.yes}>Yes.</Text>
      <Lines style={s.answer} parts={[{ b: "For Foundation Year courses there are no grade requirements to apply." }, " Offers go to|applicants who pass the Prepare for Foundation (PFF) Day — whatever their age,|experience or academic background."]} />
      <Lines style={s.answer} box={{ marginTop: 5.6 }} parts={["If your qualifications don't meet the standard entry requirements, the PFF Day is how|your suitability is assessed. You'll also need a Duolingo English certificate (see page 4)."]} />
    </View>
    <Strip label="Important:" text="you must pass the PFF Day before an offer can be confirmed." fill={C.amber} color={C.amberInk} style={{ marginTop: 9.6 }} />
    {year1Note ? <Strip label="Applying for Year 1 entry?" text="Entry requirements are different — we'll confirm them with you." fill={C.pale} color={C.navy} style={{ marginTop: 5.7 }} /> : null}
  </>;
}

function Steps({ steps, few }: { steps: Step[]; few: boolean }) {
  const m = few ? STEP.few : STEP.grid;
  return <View style={{ width: COLUMN.steps }}>{steps.map((step, i) => {
    const last = i === steps.length - 1;
    return <View key={step.title} style={{ flexDirection: "row", paddingBottom: last ? 0 : m.gap }}>
      {last ? null : <View style={[s.line, { left: m.circle / 2 - 0.45, top: m.circle }]} />}
      <NumberCircle n={i + 1} size={m.circle} fontSize={m.number} italic color={last ? C.blue : C.navy} />
      <View style={{ flex: 1, marginLeft: m.gutter, paddingTop: m.titleTop }}>
        <Text style={[s.stepTitle, { fontSize: m.title }]}>{step.title}</Text>
        <Lines parts={step.body} few={few} style={{ fontSize: m.body, color: C.body, lineHeight: m.pitch }} box={{ marginTop: m.bodyTop, marginBottom: -m.trim }} />
        {step.status ? <View style={[s.chip, { marginTop: m.chipTop }]}><Text style={s.chipText}>Your status: {step.status}</Text></View> : null}
      </View>
    </View>;
  })}</View>;
}

function DateRow({ label, value, first }: { label: string; value: string; first?: boolean }) {
  return <View style={[s.date, first ? {} : s.dateRule]}><Text style={caps(6.6, 0.16, C.sky)}>{label}</Text><Text style={[s.dateValue, { fontSize: first ? 11 : 10 }]}>{value}</Text></View>;
}

function Side({ lastPffDays }: { lastPffDays: string | null }) {
  return <View style={{ width: COLUMN.side }}>
    <View style={s.dates}>
      <Sparkle size={12.5} style={{ position: "absolute", right: 11.4, top: 11.3 }} />
      <Text style={s.datesTitle}>Key dates</Text>
      <DateRow first label="Next intake" value="To be confirmed" />
      <DateRow label="PFF days" value="To be confirmed" />
      {lastPffDays ? <DateRow label="Last intake's PFF days" value={lastPffDays} /> : null}
      <Lines style={s.datesNote} box={{ marginTop: 3.2 }} parts={["We'll send you the new dates as soon|as the college announces them."]} />
    </View>
    <View style={s.early}>
      <Text style={T.h3}>Start early</Text>
      <Lines style={s.earlyText} box={{ marginTop: 5.2 }} parts={["You need time to complete the|pre-task — and resubmit it if|needed — before you can book|a PFF Day."]} />
    </View>
  </View>;
}

export function ApplyPage({ data }: { data: OfferData }) {
  const few = data.layout === "few";
  return <PageShell data={data} page={3} note="We confirm every step and date with you when you apply.">
    <Eyebrow>02 · How to apply</Eyebrow><PageTitle>{few ? "Your journey to enrolment" : "Can I apply?"}</PageTitle>
    {few ? null : <><CanApply year1Note={data.apply.year1Note} /><Text style={[T.title, { marginTop: 19.9 }]}>Your journey to enrolment</Text></>}
    <View style={[s.columns, { marginTop: (few ? STEP.few : STEP.grid).top }]}><Steps steps={journey(data.campus.key, few)} few={few} /><Side lastPffDays={data.apply.lastPffDays} /></View>
  </PageShell>;
}
