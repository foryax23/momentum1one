import { Document, Page, View, Text, Image, StyleSheet, pdf } from "@react-pdf/renderer";
import type { LeadResult } from "@/lib/funnel";

const NAVY = "#0c2340";
const TEAL = "#2a7f9e";
const GOLD = "#b8923a";
const CREAM = "#fbf7ee";

const s = StyleSheet.create({
  page: { backgroundColor: CREAM, padding: 22, fontFamily: "Helvetica", color: NAVY },
  outer: { flex: 1, borderWidth: 2, borderColor: GOLD, padding: 6 },
  inner: { flex: 1, borderWidth: 0.8, borderColor: TEAL, paddingVertical: 26, paddingHorizontal: 48, position: "relative" },
  corner: { position: "absolute", width: 46, height: 46, borderColor: GOLD },
  watermark: { position: "absolute", top: 90, left: 270, width: 260, height: 260, opacity: 0.05 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  logo: { width: 92, height: 92 },
  ref: { fontSize: 8, letterSpacing: 2, color: TEAL, textAlign: "right" },
  eyebrow: { fontSize: 9, letterSpacing: 4, color: GOLD, textAlign: "center", marginTop: 2 },
  title: { fontFamily: "Times-Bold", fontSize: 30, textAlign: "center", marginTop: 6 },
  presented: { fontFamily: "Times-Italic", fontSize: 12, textAlign: "center", marginTop: 12, color: TEAL },
  name: { fontFamily: "Times-BoldItalic", fontSize: 36, textAlign: "center", marginTop: 4 },
  rule: { height: 1, backgroundColor: GOLD, width: 300, alignSelf: "center", marginTop: 4 },
  body: { fontSize: 10.5, textAlign: "center", lineHeight: 1.55, marginTop: 12, paddingHorizontal: 40 },
  grid: { flexDirection: "row", justifyContent: "center", marginTop: 14 },
  cell: { width: 150, alignItems: "center", paddingHorizontal: 6 },
  cellLabel: { fontSize: 7, letterSpacing: 2, color: TEAL },
  cellValue: { fontFamily: "Helvetica-Bold", fontSize: 11, marginTop: 3, textAlign: "center" },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: "auto" },
  sigBlock: { width: 190, alignItems: "center" },
  sig: { width: 150, height: 75, marginBottom: -8 },
  sigLine: { height: 0.8, backgroundColor: NAVY, width: 180 },
  sigName: { fontFamily: "Helvetica-Bold", fontSize: 10, marginTop: 4 },
  sigRole: { fontSize: 8, color: TEAL, letterSpacing: 1 },
  seal: { width: 84, height: 84, borderRadius: 42, borderWidth: 2, borderColor: GOLD, alignItems: "center", justifyContent: "center", backgroundColor: "#f3e6c4" },
  sealInner: { width: 70, height: 70, borderRadius: 35, borderWidth: 0.8, borderColor: GOLD, alignItems: "center", justifyContent: "center" },
  sealText: { fontSize: 6.5, letterSpacing: 1.5, color: GOLD, fontFamily: "Helvetica-Bold", textAlign: "center" },
});

function Corner({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const map = {
    tl: { top: 8, left: 8, borderTopWidth: 2, borderLeftWidth: 2 },
    tr: { top: 8, right: 8, borderTopWidth: 2, borderRightWidth: 2 },
    bl: { bottom: 8, left: 8, borderBottomWidth: 2, borderLeftWidth: 2 },
    br: { bottom: 8, right: 8, borderBottomWidth: 2, borderRightWidth: 2 },
  } as const;
  return <View style={[s.corner, map[pos]]} />;
}

export function OfferDocument({ lead, origin }: { lead: LeadResult; origin: string }) {
  const issued = new Date(lead.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  return (
    <Document title={`Momentum One Offer — ${lead.full_name}`} author="Momentum One">
      <Page size="A4" orientation="landscape" style={s.page}>
        <View style={s.outer}>
          <View style={s.inner}>
            <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />
            <Image src={`${origin}/logo.png`} style={s.watermark} />
            <View style={s.header}>
              <Image src={`${origin}/logo.png`} style={s.logo} />
              <View>
                <Text style={s.ref}>REFERENCE</Text>
                <Text style={[s.ref, { fontFamily: "Helvetica-Bold", fontSize: 11, color: NAVY }]}>{lead.ref_code}</Text>
                <Text style={[s.ref, { marginTop: 4 }]}>ISSUED {issued.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={s.eyebrow}>MOMENTUM ONE · UK UNIVERSITY PATHWAYS</Text>
            <Text style={s.title}>Certificate of Pre-Approved Pathway</Text>
            <Text style={s.presented}>This certificate is proudly presented to</Text>
            <Text style={s.name}>{lead.full_name}</Text>
            <View style={s.rule} />
            <Text style={s.body}>
              In recognition of taking the first step toward a UK university degree. You have been selected for a
              personal admissions pathway with our partner universities, including dedicated one-to-one guidance through
              your application, document preparation and your Prepare for Foundation (PFF) Day.
            </Text>
            <View style={s.grid}>
              <View style={s.cell}><Text style={s.cellLabel}>AREA OF STUDY</Text><Text style={s.cellValue}>{lead.interest ?? "To be advised"}</Text></View>
              <View style={s.cell}><Text style={s.cellLabel}>TARGET INTAKE</Text><Text style={s.cellValue}>{lead.intake ?? "January 2027"}</Text></View>
              <View style={s.cell}><Text style={s.cellLabel}>NEAREST CITY</Text><Text style={s.cellValue}>{lead.city}</Text></View>
              <View style={s.cell}><Text style={s.cellLabel}>NEXT STEP</Text><Text style={s.cellValue}>Advisor call</Text></View>
            </View>
            <View style={s.footer}>
              <View style={s.sigBlock}>
                <Text style={{ fontSize: 8, color: TEAL }}>Valid for the selected intake, subject to the PFF assessment.</Text>
              </View>
              <View style={s.seal}><View style={s.sealInner}><Text style={s.sealText}>{"MOMENTUM\nONE\n★ 2027 ★"}</Text></View></View>
              <View style={s.sigBlock}>
                <Image src={`${origin}/signature.png`} style={s.sig} />
                <View style={s.sigLine} />
                <Text style={s.sigName}>Robert</Text>
                <Text style={s.sigRole}>DIRECTOR, MOMENTUM ONE</Text>
              </View>
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
