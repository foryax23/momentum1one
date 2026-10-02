import { Text, View } from "@react-pdf/renderer";
import type { OfferCourse, OfferData, OfferPattern, OfferWeekDay, OfferYear1, Rich } from "./data";
import { AccentCard, C, CHOICE, ChoiceBadge, Eyebrow, PAGE, PageShell, PageTitle, Pill, RichText, Sparkle, T, caps, type Sx } from "./theme";

// Page 2. "grid" (Manchester, Derby, Sunderland): course cards in pairs, then the Year 1 box or the dashed note.
// "few" (Newcastle, Luton): large cards, the week strip, the dashed note and the "Can I apply?" block the other campuses carry on page 3.

const GAP = 10.2, EDGE = 0.6, CHOSEN_EDGE = CHOICE.border.borderWidth;
// Per layout: side padding, card top to the university label, title, gap above the italic route line, pattern text size, last pattern to card bottom.
const CARD = {
  grid: { pad: 13.1, top: 14, title: { ...T.cardTitle, marginTop: 2.34 }, route: 1.2, row: 8.2, bottom: 11.7 },
  few: { pad: 17.6, top: 17.9, title: { ...T.cardTitle, fontSize: 12.5, marginTop: 2.24 }, route: 1.35, row: 10, bottom: 16.2 },
};
const s = {
  // react-pdf squeezes the spaces of a line to fit one more word where a browser wraps; 5pt less width breaks the Manchester intro where its template does.
  intro: { ...T.intro, marginTop: 4.1, paddingRight: 5 },
  legend: { flexDirection: "row", alignItems: "center", gap: 11.35, marginTop: 9.3 },
  legendText: { fontSize: 7.4, color: C.body, lineHeight: 1.4 },
  row: { flexDirection: "row", gap: GAP },
  university: caps(6.4, 0.14),
  route: { fontSize: 8, fontStyle: "italic", color: C.body, lineHeight: 1.4 },
  divider: { height: 0.5, backgroundColor: C.line, marginTop: 6.6 },
  patternsLabel: { ...caps(6.3, 0.14, C.body), marginTop: 5.4 },
  pattern: { flexDirection: "row", alignItems: "center" },
  pills: { flexDirection: "row", alignItems: "center", gap: 2.8, flexShrink: 0 },
  // The WEEKEND outline counts towards the pill's size here, so a row of pills ends on the card's text edge.
  pill: { margin: 0 },
  year1: { marginTop: 12.5, borderRadius: PAGE.radius, backgroundColor: C.pale, paddingHorizontal: 14.2, paddingTop: 11.9, paddingBottom: 11.68 },
  entry: { flex: 1, borderRadius: 5.7, backgroundColor: C.white },
  entryTitle: { fontSize: 9, fontWeight: 700, color: C.navy, lineHeight: 1.25 },
  entryDetail: { fontSize: 7.4, color: C.body, lineHeight: 1.3, marginTop: 1.65 },
  year1Note: { fontSize: 7.8, color: C.body, lineHeight: 1.4, marginTop: 6.6 },
  note: { borderRadius: PAGE.radius, borderWidth: EDGE, borderColor: C.sky, borderStyle: "dashed", paddingHorizontal: 14.2, paddingTop: 10.6, paddingBottom: 9.8 },
  noteText: { fontSize: 8.4, color: C.body, lineHeight: 1.5 },
  noteBold: { fontWeight: 700, color: C.navy },
  week: { flexDirection: "row", gap: 4.5, marginTop: 9 },
  day: { flex: 1, minHeight: 61.3, borderRadius: 5.7, alignItems: "center", paddingTop: 7.7, paddingBottom: 7.7, paddingHorizontal: 2 },
  dayName: { fontSize: 6.6, fontWeight: 500, letterSpacing: 0.92, lineHeight: 1.4 },
  dayCourse: { fontSize: 7.4, fontWeight: 700, color: C.white, lineHeight: 1.25, textAlign: "center" },
  dayTime: { fontSize: 6.8, color: C.white, lineHeight: 1.4, marginTop: 3.1 },
  caption: { fontSize: 7.6, fontStyle: "italic", color: C.body, lineHeight: 1.4, marginTop: 8.8 },
  yes: { flexDirection: "row", marginTop: 8.7, borderRadius: PAGE.radius, backgroundColor: C.pale, paddingHorizontal: 15.3, paddingBottom: 11.5 },
  yesWord: { width: 76.6, marginTop: 9.1, fontSize: 28, fontWeight: 700, fontStyle: "italic", color: C.blue, lineHeight: 1.4 },
  yesText: { fontSize: 8.8, color: C.ink, lineHeight: 1.5 },
  important: { flexDirection: "row", marginTop: 9.6, borderRadius: 5.7, backgroundColor: C.amber, paddingHorizontal: 11.4, paddingTop: 8.4, paddingBottom: 8.36 },
  importantText: { fontSize: 8.6, color: C.amberInk, lineHeight: 1.4 },
} satisfies Record<string, Sx>;
const DAY_TONE = { navy: { fill: C.navy, name: C.sky }, blue: { fill: C.blue, name: "#dceef8" } };
// Set line by line as the templates break it: react-pdf's line breaker balances the lines of a paragraph, so the same copy would break at other words.
const APPLY: Rich[][] = [
  [[{ b: "For Foundation Year courses there are no grade requirements to apply." }, " Offers go to"], ["applicants who pass the Prepare for Foundation (PFF) Day — whatever their age,"], ["experience or academic background."]],
  [["If your qualifications don't meet the standard entry requirements, the PFF Day is how"], ["your suitability is assessed. You'll also need a Duolingo English certificate (see page 4)."]],
];

const pairs = <Item,>(items: Item[]) => Array.from({ length: Math.ceil(items.length / 2) }, (_, i) => items.slice(i * 2, i * 2 + 2));

function PatternRow({ pattern, size, first }: { pattern: OfferPattern; size: number; first: boolean }) {
  // The templates centre the pill on the text's 1.3 line box, which starts 0.05em below the top of react-pdf's text box; the margins move the box react-pdf centres on.
  // react-pdf squeezes the spaces of a line that is a few points too long instead of wrapping it; the 1.5pt on the right makes it wrap where the templates do.
  const shift = size * 0.05;
  return <View style={[s.pattern, { marginTop: first ? 2.89 : 5.08 }]}>
    <Text style={{ flex: 1, fontSize: size, color: C.ink, lineHeight: 1.3, marginTop: -shift, marginBottom: shift, paddingRight: 1.5 }}>{pattern.label}</Text>
    {pattern.tags.length ? <View style={s.pills}>{pattern.tags.map((tag) => <Pill key={tag} tag={tag} style={s.pill} />)}</View> : null}
  </View>;
}

function CourseCard({ course, few, style }: { course: OfferCourse; few: boolean; style: Sx }) {
  const m = few ? CARD.few : CARD.grid, accent = C[course.accent], edge = course.chosen ? CHOSEN_EDGE : EDGE;
  const chosen: Sx = course.chosen ? { ...CHOICE.border, borderTopColor: accent } : {};
  return <AccentCard accent={accent} style={{ paddingHorizontal: m.pad - edge, paddingTop: m.top - edge, paddingBottom: m.bottom - edge, ...chosen, ...style }}>
    {course.chosen ? <ChoiceBadge style={{ position: "absolute", right: m.pad - edge, top: m.top - edge - 0.92 }} /> : null}
    <Text style={s.university}>{course.university}</Text>
    <Text style={m.title}>{course.title}</Text>
    <Text style={[s.route, { marginTop: m.route }]}>{course.routeLine}</Text>
    <View style={s.divider} />
    <Text style={s.patternsLabel}>{course.patternsLabel}</Text>
    {course.patterns.map((pattern, i) => <PatternRow key={pattern.label} pattern={pattern} size={m.row} first={i === 0} />)}
  </AccentCard>;
}

function Year1Entry({ entry }: { entry: OfferYear1 }) {
  const edge = entry.chosen ? CHOSEN_EDGE : 0;
  return <View style={[s.entry, { paddingHorizontal: 9.6 - edge, paddingTop: 6.9 - edge, paddingBottom: 7.78 - edge }, entry.chosen ? CHOICE.border : {}]}>
    {entry.chosen ? <ChoiceBadge style={{ position: "absolute", right: 9.6 - edge, top: -edge - 5.4 }} /> : null}
    <Text style={s.entryTitle}>{entry.title}</Text>
    <Text style={s.entryDetail}>{entry.detail}</Text>
  </View>;
}

function Year1Box({ year1 }: { year1: NonNullable<OfferData["courses"]["year1"]> }) {
  // The badge of a chosen entry straddles the top edge of its box, so the boxes sit a little lower to keep it clear of the heading.
  const lift = year1.list.some((entry) => entry.chosen) ? 4 : 0;
  return <View style={s.year1}>
    <Text style={T.h3}>{year1.title}</Text>
    {pairs(year1.list).map((row, i) => <View key={i} style={{ flexDirection: "row", gap: 8.5, marginTop: i ? 8.5 : 6.2 + lift }}>{row.map((entry) => <Year1Entry key={entry.id} entry={entry} />)}</View>)}
    <Text style={s.year1Note}>{year1.note}</Text>
  </View>;
}

function WeekDay({ day }: { day: OfferWeekDay }) {
  const tone = day.tone ? DAY_TONE[day.tone] : null;
  return <View style={[s.day, { backgroundColor: tone?.fill ?? C.pale }]}>
    {day.chosen ? <Sparkle size={5.4} color={tone ? C.white : C.blue} style={{ position: "absolute", right: 6, top: 6 }} /> : null}
    <Text style={[s.dayName, { color: tone?.name ?? C.body }]}>{day.day}</Text>
    {day.lines.map((line, i) => <Text key={i} style={[s.dayCourse, { marginTop: i ? 0 : 5.46 }]}>{line}</Text>)}
    {day.time ? <Text style={s.dayTime}>{day.time}</Text> : null}
  </View>;
}

function CanApply() {
  return <>
    <Eyebrow style={{ marginTop: 20.3 }}>Entry requirements</Eyebrow><PageTitle>Can I apply?</PageTitle>
    <View style={s.yes}>
      <Text style={s.yesWord}>Yes.</Text>
      <View style={{ flex: 1, marginTop: 12.3 }}>{APPLY.map((lines, i) => <View key={i} style={{ marginTop: i ? 5.7 : 0 }}>{lines.map((parts, j) => <RichText key={j} parts={parts} style={s.yesText} />)}</View>)}</View>
    </View>
    <View style={s.important}>
      <Text style={[s.importantText, { fontWeight: 700 }]}>Important:</Text>
      <Text style={[s.importantText, { flex: 1, marginLeft: 8.5 }]}>you must pass the PFF Day before an offer can be confirmed.</Text>
    </View>
  </>;
}

export function CoursesPage({ data }: { data: OfferData }) {
  const { courses } = data, few = data.layout === "few", half = (PAGE.inner - GAP) / 2;
  // A campus whose timetable is still to be confirmed (Luton) has no tagged pattern, so the key to the tags is left out.
  const tagged = courses.list.some((course) => course.patterns.some((pattern) => pattern.tags.length > 0));
  return <PageShell data={data} page={2} note={courses.footnote}>
    <Eyebrow>01 · The courses</Eyebrow><PageTitle>{courses.title}</PageTitle>
    <Text style={s.intro}>{courses.intro}</Text>
    {tagged ? <View style={s.legend}>
      <Pill tag="DAYTIME" size="legend" /><Pill tag="EVENING" size="legend" /><Pill tag="WEEKEND" size="legend" style={s.pill} />
      <Text style={s.legendText}>{courses.legend}</Text>
    </View> : null}
    {pairs(courses.list).map((row, i) => <View key={i} style={[s.row, { marginTop: i ? GAP : tagged ? 11.3 : 14 }]}>
      {row.map((course) => <CourseCard key={course.id} course={course} few={few} style={few && courses.list.length === 1 ? { flex: 1 } : { width: half }} />)}
    </View>)}
    {courses.week ? <>
      <Text style={[T.h3, { marginTop: 17.6 }]}>{courses.week.title}</Text>
      <View style={s.week}>{courses.week.days.map((day) => <WeekDay key={day.day} day={day} />)}</View>
      <Text style={s.caption}>{courses.week.caption}</Text>
    </> : null}
    {courses.year1 ? <Year1Box year1={courses.year1} /> : null}
    {courses.note ? <View style={[s.note, { marginTop: courses.week ? 12.86 : 12.5 }]}><RichText parts={courses.note} style={s.noteText} bold={s.noteBold} /></View> : null}
    {few ? <CanApply /> : null}
  </PageShell>;
}
