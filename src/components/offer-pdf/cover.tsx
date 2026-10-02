import { Ellipse, Image, Svg, Text, View } from "@react-pdf/renderer";
import type { OfferData } from "./data";
import { Abs, AccentCard, BlankPage, C, ChoiceBadge, CurvedBand, Icon, PAGE, Para, Ring, Sparkle, T, caps, textEm, type Sx } from "./theme";

// Page 1, on the template's coordinates. The student block beside the logo (name, campus · reference · date, chosen course) takes the place of the
// template's "Derby campus / NEXT INTAKE · DATES TBA" lines; everything below it sits where the template puts it.

/** The column right of the logo, which ends at x = 192.8. */
const SIDE = { x: 200, w: PAGE.right - 200 };
const NAME = { size: 15, min: 10.5, pitch: 1.25 };
const CARD = { w: 116.94, h: 93.9 }, REASON = { w: 236.67, text: 202.77 };

const s = {
  logo: { position: "absolute", left: 51, top: 36.9, width: 141.8, height: 121.9 },
  pill: { backgroundColor: C.navy, borderRadius: 10.8, paddingTop: 5.4, paddingBottom: 5.56, paddingHorizontal: 11.9 },
  pillText: caps(7.6, 0.2, C.white, 700),
  name: { textAlign: "right", lineHeight: NAME.pitch },
  meta: { textAlign: "right" },
  choice: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginTop: 8.4 },
  choiceText: { flexShrink: 1, marginLeft: 6, textAlign: "right", fontSize: 7.8, lineHeight: 1.4, color: C.body },
  choiceTitle: { fontWeight: 700, color: C.navy },
  cards: { flexDirection: "row", gap: 8.5 },
  card: { height: CARD.h, paddingTop: 13.6, paddingHorizontal: 10.2 },
  cardLabel: { marginTop: 8.6 },
  cardValue: { marginTop: 1.36, marginBottom: 0.76 },
  cardNote: { ...T.small, lineHeight: 1.347 },
  center: { textAlign: "center" },
  reasons: { flexDirection: "row", gap: 19.9 },
  reason: { width: REASON.w, flexDirection: "row", flexShrink: 0 },
  reasonText: { width: REASON.text, flexShrink: 0 },
  numeral: { width: 24.3, height: 22.7, marginRight: 9.6, flexShrink: 0 },
  numeralRing: { position: "absolute", left: 0, top: 0 },
  numeralText: { marginTop: 4.6, textAlign: "center", fontSize: 10, fontWeight: 700, fontStyle: "italic", color: C.sky, lineHeight: 1.4 },
  reasonTitle: { marginTop: 0.5, marginBottom: 2.4, fontSize: 10, fontWeight: 700, color: C.white, lineHeight: 1.4 },
  reasonBody: { ...T.body, color: C.onNavy },
  cta: { marginTop: 22.43, height: 49.3, borderRadius: 24.65, backgroundColor: C.white, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingLeft: 22.7, paddingRight: 11.4 },
  ctaText: { marginTop: 0.1, fontSize: 8, color: C.body, lineHeight: 1.4 },
  button: { width: 166.3, height: 30, borderRadius: 15, backgroundColor: C.navy, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  buttonText: { fontSize: 9.4, fontWeight: 700, fontStyle: "italic", color: C.white, lineHeight: 1.4 },
  tagline: { ...caps(7, 0.24, C.sky, 400), textAlign: "center" },
} satisfies Record<string, Sx>;

// The template's numbered rings are slightly wider than tall (24.3 × 22.7), so they are drawn rather than made from a rounded box.
function Numeral({ n }: { n: number }) {
  return <View style={s.numeral}>
    <Svg width={24.3} height={22.7} viewBox="0 0 24.3 22.7" style={s.numeralRing}><Ellipse cx={12.15} cy={11.35} rx={11.75} ry={10.95} fill="none" stroke={C.sky} strokeWidth={0.8} /></Svg>
    <Text style={s.numeralText}>{n}</Text>
  </View>;
}

export function CoverPage({ data }: { data: OfferData }) {
  const { cover, choice } = data;
  // A long name is set smaller rather than wrapped. One that is too wide even at the smallest size wraps, and the lines under it move down with it.
  const nameEm = textEm(cover.name, { fontWeight: 700, fontStyle: "italic" }, data.nameFont) ?? cover.name.length * 0.64;
  const nameSize = Math.max(NAME.min, Math.min(NAME.size, Math.floor(SIDE.w / nameEm * 10) / 10));
  // Keeps the name's baseline (y = 96.3) and the line under it (top y = 101.5) on the template's positions at any size.
  const nameTop = 5.1 + (NAME.size - nameSize) * 1.05, metaTop = 20.9 - (NAME.size - nameSize) * 1.05 - NAME.pitch * nameSize;
  return <BlankPage>
    <Image src={data.assets.logo} style={s.logo} />
    <Abs x={SIDE.x} y={53.9} w={SIDE.w} style={{ alignItems: "flex-end" }}>
      <View style={s.pill}><Text style={s.pillText}>{cover.pill}</Text></View>
      <Text style={[T.name, s.name, { fontFamily: data.nameFont, fontSize: nameSize, marginTop: nameTop }]}>{cover.name}</Text>
      <Text style={[T.meta, s.meta, { marginTop: metaTop }]}>{cover.meta.join(" · ")}</Text>
      {choice ? <View style={s.choice}><ChoiceBadge /><Text style={s.choiceText}><Text style={s.choiceTitle}>{choice.title}</Text>{choice.rest}</Text></View> : null}
    </Abs>
    <Abs x={PAGE.x} y={204.5}><Text style={T.eyebrow}>{cover.eyebrow}</Text></Abs>
    <Abs x={PAGE.x} y={216.3}><Text style={T.h1}>{cover.headline[0]}</Text><Text style={T.h1}>in <Text style={{ color: C.blue }}>{cover.headline[1]}</Text></Text></Abs>
    <Abs x={PAGE.x} y={314.3}><Para parts={cover.lead} style={T.lead} width={425.2} /></Abs>
    <Abs x={PAGE.x} y={371.3} style={s.cards}>
      {cover.facts.map((fact) => <AccentCard key={fact.label} accent={C.blue} width={CARD.w} fill={C.pale} border={null} style={s.card}>
        <Icon name={fact.icon} /><Text style={[T.label, s.cardLabel]}>{fact.label}</Text><Text style={[T.value, s.cardValue]}>{fact.value}</Text><Para parts={fact.note} style={s.cardNote} width={96.54} />
      </AccentCard>)}
    </Abs>
    <CurvedBand kind="dome" top={470.6} />
    <Abs x={85} y={504.6}><Sparkle size={11.3} /></Abs><Abs x={487.6} y={513.1}><Sparkle size={15.6} /></Abs><Abs x={527.4} y={550.1}><Ring size={6.5} /></Abs>
    <Abs x={0} y={519.1} w={PAGE.w}><Text style={[T.eyebrow, s.center, { color: C.sky }]}>{cover.bandEyebrow}</Text></Abs>
    <Abs x={0} y={531.4} w={PAGE.w}><Text style={[T.bandTitle, s.center]}>{cover.bandTitle}</Text></Abs>
    {/* The call-to-action bar follows the reasons, so it rises when the second row is short (Newcastle, Luton). */}
    <Abs x={PAGE.x} y={570.1} w={PAGE.inner}>
      {[0, 2].map((from) => <View key={from} style={[s.reasons, { marginTop: from ? 11.73 : 0 }]}>
        {cover.reasons.slice(from, from + 2).map((reason, i) => <View key={reason.title} style={s.reason}>
          <Numeral n={from + i + 1} />
          <View style={s.reasonText}><Text style={s.reasonTitle}>{reason.title}</Text><Para parts={reason.body} style={s.reasonBody} width={REASON.text} /></View>
        </View>)}
      </View>)}
      <View style={s.cta}>
        <View><Text style={T.cardTitle}>{cover.cta.title}</Text><Text style={s.ctaText}>{cover.cta.text}</Text></View>
        <View style={s.button}><Text style={s.buttonText}>{cover.cta.button}</Text></View>
      </View>
    </Abs>
    <Abs x={0} y={807.6} w={PAGE.w}><Text style={s.tagline}>{cover.tagline}</Text></Abs>
  </BlankPage>;
}
