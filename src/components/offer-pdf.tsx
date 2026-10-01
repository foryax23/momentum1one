import { Document, Page, View, Text, Image, StyleSheet, Svg, Path, Circle, Rect, G, pdf } from "@react-pdf/renderer";
import type { LeadResult } from "@/lib/funnel";

const INK = "#0c2340";
const TEAL = "#2a7f9e";
const GOLD = "#b8923a";
const CREAM = "#fbf8f0";

const W = 841;
const H = 594;

const s = StyleSheet.create({
  page: { backgroundColor: CREAM, fontFamily: "Helvetica", color: INK },
  layer: { position: "absolute", top: 0, left: 0 },
  content: { position: "absolute", top: 46, left: 70, right: 70, bottom: 46 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  logo: { width: 78, height: 67, objectFit: "contain" },
  refLabel: { fontSize: 7, letterSpacing: 2, color: TEAL, textAlign: "right" },
  refValue: { fontFamily: "Helvetica-Bold", fontSize: 12, textAlign: "right", marginTop: 2 },
  eyebrow: { fontSize: 8.5, letterSpacing: 4, color: GOLD, textAlign: "center", marginTop: -6 },
  title: { fontFamily: "Times-Bold", fontSize: 32, textAlign: "center", marginTop: 6, letterSpacing: 0.5 },
  presented: { fontFamily: "Times-Italic", fontSize: 12, textAlign: "center", marginTop: 10, color: TEAL },
  name: { fontFamily: "Times-BoldItalic", fontSize: 40, textAlign: "center", marginTop: 2 },
  body: { fontSize: 10, textAlign: "center", lineHeight: 1.6, marginTop: 10, paddingHorizontal: 70, color: "#3a4a60" },
  facts: { flexDirection: "row", justifyContent: "center", marginTop: 14, borderTopWidth: 0.6, borderBottomWidth: 0.6, borderColor: GOLD, paddingVertical: 8, marginHorizontal: 40 },
  fact: { flex: 1, alignItems: "center", borderRightWidth: 0.4, borderColor: "#d8cba8" },
  factLabel: { fontSize: 6.5, letterSpacing: 2, color: TEAL },
  factValue: { fontFamily: "Helvetica-Bold", fontSize: 10.5, marginTop: 3, textAlign: "center" },
  steps: { flexDirection: "row", justifyContent: "center", marginTop: 12 },
  step: { flexDirection: "row", alignItems: "center", marginHorizontal: 8 },
  stepNum: { width: 14, height: 14, borderRadius: 7, backgroundColor: INK, color: CREAM, fontSize: 7, textAlign: "center", paddingTop: 3, fontFamily: "Helvetica-Bold" },
  stepText: { fontSize: 8, marginLeft: 5 },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: "auto" },
  block: { width: 200 },
  sig: { width: 150, height: 75, marginBottom: -10, alignSelf: "center" },
  line: { height: 0.8, backgroundColor: INK },
  sigName: { fontFamily: "Helvetica-Bold", fontSize: 10, marginTop: 4, textAlign: "center" },
  sigRole: { fontSize: 7.5, color: TEAL, letterSpacing: 1.5, textAlign: "center", marginTop: 1 },
});

/** Engraved double frame with ornamental corners, drawn as vector. */
function Frame() {
  const corner = (x: number, y: number, sx: number, sy: number) => (
    <G transform={`translate(${x} ${y}) scale(${sx} ${sy})`}>
      <Path d="M0 0 L46 0 M0 0 L0 46" stroke={GOLD} strokeWidth={2} />
      <Path d="M8 8 C 30 8, 8 30, 30 30 C 8 30, 30 8, 8 8 Z" stroke={GOLD} strokeWidth={0.8} fill="none" />
      <Circle cx={30} cy={30} r={2.4} fill={GOLD} />
      <Path d="M14 0 C14 10, 10 14, 0 14" stroke={TEAL} strokeWidth={0.6} fill="none" />
    </G>
  );
  return (
    <View style={[s.layer, { width: W, height: H }]} fixed>
    <Svg width={W} height={H}>
      <Rect x={18} y={18} width={W - 36} height={H - 36} stroke={GOLD} strokeWidth={2.2} fill="none" />
      <Rect x={25} y={25} width={W - 50} height={H - 50} stroke={GOLD} strokeWidth={0.6} fill="none" />
      <Rect x={32} y={32} width={W - 64} height={H - 64} stroke={TEAL} strokeWidth={0.5} fill="none" strokeDasharray="1 3" />
      {corner(32, 32, 1, 1)}
      {corner(W - 32, 32, -1, 1)}
      {corner(32, H - 32, 1, -1)}
      {corner(W - 32, H - 32, -1, -1)}
      {/* guilloche band along top and bottom */}
      {Array.from({ length: 40 }).map((_, i) => (
        <G key={i}>
          <Circle cx={160 + i * 13.2} cy={40} r={6} stroke={GOLD} strokeWidth={0.3} fill="none" opacity={0.6} />
          <Circle cx={160 + i * 13.2} cy={H - 40} r={6} stroke={GOLD} strokeWidth={0.3} fill="none" opacity={0.6} />
        </G>
      ))}
    </Svg>
    </View>
  );
}

function SealSvg() {
  const rays = Array.from({ length: 36 });
  return (
    <Svg width={96} height={96} viewBox="0 0 100 100">
      {rays.map((_, i) => {
        const a = (i / rays.length) * Math.PI * 2;
        const x1 = 50 + Math.cos(a) * 40, y1 = 50 + Math.sin(a) * 40;
        const x2 = 50 + Math.cos(a) * 48, y2 = 50 + Math.sin(a) * 48;
        return <Path key={i} d={`M${x1} ${y1} L${x2} ${y2}`} stroke={GOLD} strokeWidth={2.4} />;
      })}
      <Circle cx={50} cy={50} r={40} fill="#efe0b6" stroke={GOLD} strokeWidth={1.4} />
      <Circle cx={50} cy={50} r={33} fill="none" stroke={GOLD} strokeWidth={0.6} strokeDasharray="2 2" />
      <Circle cx={50} cy={50} r={26} fill="none" stroke={GOLD} strokeWidth={0.8} />
      <Path d="M50 30 L53 40 L64 40 L55 46 L58 57 L50 50 L42 57 L45 46 L36 40 L47 40 Z" fill={GOLD} />
      <Path d="M38 64 L62 64" stroke={GOLD} strokeWidth={0.8} />
    </Svg>
  );
}

/** Deterministic QR-style verification block derived from the reference. */
function RefBlock({ code }: { code: string }) {
  let h = 2166136261;
  for (const c of code) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const cells: [number, number][] = [];
  for (let y = 0; y < 11; y++) for (let x = 0; x < 11; x++) {
    h = Math.imul(h ^ (x * 31 + y), 16777619);
    const finder = (x < 3 && y < 3) || (x > 7 && y < 3) || (x < 3 && y > 7);
    if (!finder && (h >>> 28) % 2 === 0) cells.push([x, y]);
  }
  const finder = (x: number, y: number) => (
    <G key={`${x}-${y}`}><Rect x={x} y={y} width={3} height={3} fill={INK} /><Rect x={x + 0.6} y={y + 0.6} width={1.8} height={1.8} fill={CREAM} /><Rect x={x + 1.1} y={y + 1.1} width={0.8} height={0.8} fill={INK} /></G>
  );
  return (
    <Svg width={52} height={52} viewBox="0 0 11 11">
      {cells.map(([x, y]) => <Rect key={`${x}.${y}`} x={x} y={y} width={1} height={1} fill={INK} />)}
      {finder(0, 0)}{finder(8, 0)}{finder(0, 8)}
    </Svg>
  );
}

export function OfferDocument({ lead, origin }: { lead: LeadResult; origin: string }) {
  const issued = new Date(lead.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  return (
    <Document title={`Momentum One Offer, ${lead.full_name}`} author="Momentum One">
      <Page size="A4" orientation="landscape" style={s.page} wrap={false}>
        <Frame />
        <Image src={`${origin}/logo-mark.png`} style={{ position: "absolute", top: 150, left: W / 2 - 150, width: 300, height: 250, opacity: 0.04 }} />
        <View style={s.content}>
          <View style={s.header}>
            <Image src={`${origin}/logo.png`} style={s.logo} />
            <View style={{ alignItems: "flex-end" }}>
              <Text style={s.refLabel}>REFERENCE</Text>
              <Text style={s.refValue}>{lead.ref_code}</Text>
              <Text style={[s.refLabel, { marginTop: 5 }]}>ISSUED {issued.toUpperCase()}</Text>
            </View>
          </View>

          <Text style={s.eyebrow}>MOMENTUM ONE · UK UNIVERSITY PATHWAYS</Text>
          <Text style={s.title}>Certificate of Pre-Approved Pathway</Text>
          <Text style={s.presented}>This certificate is proudly presented to</Text>
          <Text style={s.name}>{lead.full_name}</Text>
          <Text style={s.body}>
            In recognition of taking the first step toward a UK university degree. You have been selected for a personal
            admissions pathway with our partner universities, with one-to-one guidance through your application, your
            documents and your Prepare for Foundation (PFF) Day.
          </Text>

          <View style={s.facts}>
            {[["AREA OF STUDY", lead.interest ?? "To be advised"], ["TARGET INTAKE", lead.intake ?? "January 2027"], ["NEAREST CITY", lead.city], ["STATUS", "Pre-approved"]].map(([l, v], i) => (
              <View key={l} style={[s.fact, i === 3 ? { borderRightWidth: 0 } : {}]}>
                <Text style={s.factLabel}>{l}</Text>
                <Text style={s.factValue}>{v}</Text>
              </View>
            ))}
          </View>

          <View style={s.steps}>
            {["Advisor call", "Documents", "PFF Day", "Enrol"].map((t, i) => (
              <View key={t} style={s.step}><Text style={s.stepNum}>{i + 1}</Text><Text style={s.stepText}>{t}</Text></View>
            ))}
          </View>

          <View style={s.footer}>
            <View style={[s.block, { flexDirection: "row", alignItems: "flex-end" }]}>
              <RefBlock code={lead.ref_code} />
              <View style={{ marginLeft: 8, width: 130 }}>
                <Text style={{ fontSize: 6.5, letterSpacing: 1.5, color: TEAL }}>VERIFICATION</Text>
                <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", marginTop: 2 }}>{lead.ref_code}</Text>
                <Text style={{ fontSize: 6.5, color: "#5b6b80", marginTop: 3, lineHeight: 1.4 }}>Valid for the selected intake, subject to the PFF assessment.</Text>
              </View>
            </View>
            <SealSvg />
            <View style={s.block}>
              <Image src={`${origin}/signature.png`} style={s.sig} />
              <View style={s.line} />
              <Text style={s.sigName}>Robert</Text>
              <Text style={s.sigRole}>DIRECTOR, MOMENTUM ONE</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function downloadOffer(lead: LeadResult) {
  const blob = await pdf(<OfferDocument lead={lead} origin={window.location.origin} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Momentum-One-Offer-${lead.ref_code}.pdf`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
