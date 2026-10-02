import { Rect, Svg, Text, View } from "@react-pdf/renderer";
import type { OfferCourse, OfferData, OfferPattern, OfferWeekDay, OfferYear1, Rich } from "./data";
import { CanApply } from "./apply";
import { AccentCard, C, CHOICE, ChoiceBadge, Eyebrow, PAGE, PILL_WIDTH, PageShell, PageTitle, Para, Pill, Sparkle, T, breakLines, caps, type Sx } from "./theme";

// Page 2. "grid" (Manchester, Derby, Sunderland): course cards in pairs, then the Year 1 box or the dashed note.
// "few" (Newcastle, Luton): large cards, the week strip (seven open days while the timetable is to be confirmed), the dashed note and the "Can I apply?" block the
// other campuses carry on page 3.

const GAP = 10.2, EDGE = 0.6, CHOSEN_EDGE = CHOICE.border.borderWidth, PILL_GAP = 2.8;
const BOX = { pad: 14.2, entryGap: 8.5, entryPad: 9.6 }, NOTE = { top: 10.6, bottom: 9.8 };
const ENTRY_TEXT = (PAGE.inner - 2 * BOX.pad - BOX.entryGap) / 2 - 2 * BOX.entryPad;
// Per layout: side padding, card top to the university label, title size and the gaps above it and above the italic route line, pattern text size, last pattern to card bottom.
const CARD = {
  grid: { pad: 13.1, top: 14, title: 10.4, titleTop: 2.34, route: 1.2, row: 8.2, bottom: 11.7 },
  few: { pad: 17.6, top: 17.9, title: 12.5, titleTop: 2.24, route: 1.35, row: 10, bottom: 16.2 },
};
const s = {
  legend: { flexDirection: "row", alignItems: "center", gap: 11.35, marginTop: 9.3 },
  legendText: { fontSize: 7.4, color: C.body, lineHeight: 1.4 },
  row: { flexDirection: "row", gap: GAP },
  university: caps(6.4, 0.14),
  route: { fontSize: 8, fontStyle: "italic", color: C.body, lineHeight: 1.4 },
  divider: { height: 0.5, backgroundColor: C.line, marginTop: 6.6 },
  patternsLabel: { ...caps(6.3, 0.14, C.body), marginTop: 5.4 },
  pattern: { flexDirection: "row", alignItems: "center" },
  pills: { flexDirection: "row", alignItems: "center", gap: PILL_GAP, flexShrink: 0 },
  year1: { marginTop: 12.5, borderRadius: PAGE.radius, backgroundColor: C.pale, paddingHorizontal: BOX.pad, paddingTop: 11.9, paddingBottom: 11.68 },
  entry: { flex: 1, borderRadius: 5.7, backgroundColor: C.white },
  entryTitle: { fontSize: 9, fontWeight: 700, color: C.navy, lineHeight: 1.25 },
  entryDetail: { fontSize: 7.4, color: C.body, lineHeight: 1.3 },
  year1Note: { fontSize: 7.8, color: C.body, lineHeight: 1.4 },
  note: { paddingHorizontal: BOX.pad + EDGE, paddingTop: NOTE.top + EDGE, paddingBottom: NOTE.bottom + EDGE },
  noteOutline: { borderRadius: PAGE.radius, borderWidth: EDGE, borderColor: C.sky, borderStyle: "dashed", paddingHorizontal: BOX.pad, paddingTop: NOTE.top, paddingBottom: NOTE.bottom },
  noteText: { fontSize: 8.4, color: C.body, lineHeight: 1.5 },
  noteBold: { fontWeight: 700, color: C.navy },
  week: { flexDirection: "row", gap: 4.5, marginTop: 9 },
  day: { flex: 1, minHeight: 61.3, borderRadius: 5.7, alignItems: "center", paddingTop: 7.7, paddingBottom: 7.7, paddingHorizontal: 2 },
  dayName: { fontSize: 6.6, fontWeight: 500, letterSpacing: 0.92, lineHeight: 1.4 },
  dayCourse: { fontSize: 7.4, fontWeight: 700, color: C.white, lineHeight: 1.25, textAlign: "center" },
  dayTime: { fontSize: 6.8, color: C.white, lineHeight: 1.4, marginTop: 3.1 },
  caption: { fontSize: 7.6, fontStyle: "italic", color: C.body, lineHeight: 1.4, marginTop: 8.8 },
} satisfies Record<string, Sx>;
const DAY_TONE = { navy: { fill: C.navy, name: C.sky }, blue: { fill: C.blue, name: "#dceef8" } };
const pairs = <Item,>(items: Item[]) => Array.from({ length: Math.ceil(items.length / 2) }, (_, i) => items.slice(i * 2, i * 2 + 2));

function PatternRow({ pattern, size, width, first }: { pattern: OfferPattern; size: number; width: number; first: boolean }) {
  const pills = pattern.tags.reduce((total, tag) => total + PILL_WIDTH[tag], 0) + PILL_GAP * Math.max(0, pattern.tags.length - 1);
  // The templates centre the pill on the text's 1.3 line box, which starts 0.05em below the top of react-pdf's text box; the margins move the box react-pdf centres on.
  // Their text runs right up to the pill, and by a hair over it on the longest one-line patterns, hence the 0.3pt on the measure.
  const shift = size * 0.05;
  return <View style={[s.pattern, { marginTop: first ? 2.89 : 5.08 }]}>
    <Para parts={pattern.label} width={width - pills + 0.3} style={{ fontSize: size, color: C.ink, lineHeight: 1.3 }} box={{ flex: 1, marginTop: -shift, marginBottom: shift }} />
    {pattern.tags.length ? <View style={s.pills}>{pattern.tags.map((tag) => <Pill key={tag} tag={tag} />)}</View> : null}
  </View>;
}

function CourseCard({ course, few, width }: { course: OfferCourse; few: boolean; width: number }) {
  const m = few ? CARD.few : CARD.grid, edge = course.chosen ? CHOSEN_EDGE : EDGE;
  return <AccentCard accent={C[course.accent]} width={width} {...(course.chosen ? { border: CHOICE.border } : {})} style={{ paddingHorizontal: m.pad - edge, paddingTop: m.top - edge, paddingBottom: m.bottom - edge }}>
    {course.chosen ? <ChoiceBadge style={{ position: "absolute", right: m.pad - edge, top: m.top - edge - 0.92 }} /> : null}
    <Text style={s.university}>{course.university}</Text>
    <Para parts={course.title} width={width - 2 * m.pad} style={{ ...T.cardTitle, fontSize: m.title }} box={{ marginTop: m.titleTop }} />
    <Text style={[s.route, { marginTop: m.route }]}>{course.routeLine}</Text>
    <View style={s.divider} />
    <Text style={s.patternsLabel}>{course.patternsLabel}</Text>
    {course.patterns.map((pattern, i) => <PatternRow key={pattern.label} pattern={pattern} size={m.row} width={width - 2 * m.pad} first={i === 0} />)}
  </AccentCard>;
}

function Year1Entry({ entry }: { entry: OfferYear1 }) {
  const edge = entry.chosen ? CHOSEN_EDGE : 0;
  return <View style={[s.entry, { paddingHorizontal: BOX.entryPad - edge, paddingTop: 6.9 - edge, paddingBottom: 7.78 - edge }, entry.chosen ? CHOICE.border : {}]}>
    {entry.chosen ? <ChoiceBadge style={{ position: "absolute", right: BOX.entryPad - edge, top: -edge - 5.4 }} /> : null}
    <Para parts={entry.title} width={ENTRY_TEXT} style={s.entryTitle} />
    <Para parts={entry.detail} width={ENTRY_TEXT} style={s.entryDetail} box={{ marginTop: 1.65 }} />
  </View>;
}

function Year1Box({ year1 }: { year1: NonNullable<OfferData["courses"]["year1"]> }) {
  // The badge of a chosen entry straddles the top edge of its box, so the boxes sit a little lower to keep it clear of the heading.
  const lift = year1.list.some((entry) => entry.chosen) ? 4 : 0;
  return <View style={s.year1}>
    <Text style={T.h3}>{year1.title}</Text>
    {pairs(year1.list).map((row, i) => <View key={i} style={{ flexDirection: "row", gap: BOX.entryGap, marginTop: i ? BOX.entryGap : 6.2 + lift }}>{row.map((entry) => <Year1Entry key={entry.id} entry={entry} />)}</View>)}
    <Para parts={year1.note} width={PAGE.inner - 2 * BOX.pad} style={s.year1Note} box={{ marginTop: 6.6 }} />
  </View>;
}

function WeekDay({ day }: { day: OfferWeekDay }) {
  const tone = day.tone ? DAY_TONE[day.tone] : null;
  return <View style={[s.day, { backgroundColor: tone?.fill ?? C.pale }]}>
    {day.chosen ? <Sparkle size={5.4} style={{ position: "absolute", right: 6, top: 6 }} /> : null}
    <Text style={[s.dayName, { color: tone?.name ?? C.body }]}>{day.day}</Text>
    {day.lines.map((line, i) => <Text key={i} style={[s.dayCourse, { marginTop: i ? 0 : 5.46 }]}>{line}</Text>)}
    {day.time ? <Text style={s.dayTime}>{day.time}</Text> : null}
  </View>;
}

function Note({ parts, top }: { parts: Rich; top: number }) {
  const width = PAGE.inner - 2 * (BOX.pad + EDGE), lines = breakLines(parts, width, s.noteText)?.length;
  const height = 2 * EDGE + NOTE.top + NOTE.bottom + (lines ?? 0) * s.noteText.fontSize * s.noteText.lineHeight;
  // The templates' dashes and gaps are three line widths long; react-pdf's own dashed border is much finer. So the outline is drawn, which needs the height of
  // the box, known from the number of lines. Only when the text cannot be measured does the note fall back to react-pdf's border.
  return <View style={[s.note, { marginTop: top }, lines ? {} : s.noteOutline]}>
    {lines ? <Svg width={PAGE.inner} height={height} viewBox={`0 0 ${PAGE.inner} ${height}`} style={{ position: "absolute", left: 0, top: 0 }}>
      <Rect x={EDGE / 2} y={EDGE / 2} width={PAGE.inner - EDGE} height={height - EDGE} rx={PAGE.radius - EDGE / 2} ry={PAGE.radius - EDGE / 2} fill="none" stroke={C.sky} strokeWidth={EDGE} strokeDasharray={`${3 * EDGE} ${3 * EDGE}`} />
    </Svg> : null}
    <Para parts={parts} width={width} style={s.noteText} bold={s.noteBold} />
  </View>;
}

export function CoursesPage({ data }: { data: OfferData }) {
  const { courses } = data, few = data.layout === "few", half = (PAGE.inner - GAP) / 2;
  // Luton, whose timetable is not out, has no key row and a one-line course title. The 21.6pt those take on Newcastle's page goes into three gaps, so its page fills as far.
  const air = few && !courses.legend ? 7.2 : 0;
  return <PageShell data={data} page={2} note={courses.footnote}>
    <Eyebrow>01 · The courses</Eyebrow><PageTitle>{courses.title}</PageTitle>
    <Para parts={courses.intro} width={PAGE.inner} style={T.intro} box={{ marginTop: 4.1 }} />
    {courses.legend ? <View style={s.legend}>
      <Pill tag="DAYTIME" size="legend" /><Pill tag="EVENING" size="legend" /><Pill tag="WEEKEND" size="legend" />
      <Text style={s.legendText}>{courses.legend}</Text>
    </View> : null}
    {pairs(courses.list).map((row, i) => <View key={i} style={[s.row, { marginTop: i ? GAP : courses.legend ? 11.3 : 14 + air }]}>
      {row.map((course) => <CourseCard key={course.id} course={course} few={few} width={few && courses.list.length === 1 ? PAGE.inner : half} />)}
    </View>)}
    {courses.week ? <>
      <Text style={[T.h3, { marginTop: 17.6 + air }]}>{courses.week.title}</Text>
      <View style={s.week}>{courses.week.days.map((day) => <WeekDay key={day.day} day={day} />)}</View>
      <Text style={s.caption}>{courses.week.caption}</Text>
    </> : null}
    {courses.year1 ? <Year1Box year1={courses.year1} /> : null}
    {courses.note ? <Note parts={courses.note} top={courses.week ? 12.86 : 12.5} /> : null}
    {few ? <><Eyebrow style={{ marginTop: 20.3 + air }}>Entry requirements</Eyebrow><PageTitle>Can I apply?</PageTitle><CanApply year1Note={data.apply.year1Note} /></> : null}
  </PageShell>;
}
