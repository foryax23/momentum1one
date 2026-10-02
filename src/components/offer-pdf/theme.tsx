import type { ReactNode } from "react";
import { Page, View, Text, Image, Font, Svg, Path, Circle, Rect, type Styles } from "@react-pdf/renderer";
import type { OfferData, PatternTag, Rich } from "./data";
import { CHOICE_BADGE } from "./data";

// Shared look of the offer PDF, measured from the client's A4 templates. Every length is in PDF points, from the top-left of the page.
// Text sits with its baseline 1.05 × fontSize below the top of its box whatever the lineHeight, and lineHeight × fontSize is the distance between baselines.

export type Sx = Styles[string];

// The built-in PDF fonts are Latin-1 only (no ă ș ț), so the template's own family is embedded. These are the Latin + Latin Extended builds
// (css?family=Poppins:…&subset=latin,latin-ext); the plain css?family files are Latin only. Poppins has no Cyrillic or Greek, so Manrope stands behind it for names.
const GSTATIC = "https://fonts.gstatic.com/s";
const upright = (fontFamily: string, fontWeight: number, src: string) => ({ fontFamily, fontWeight, fontStyle: "normal" as const, src: `${GSTATIC}/${src}.ttf` });
const italic = (fontFamily: string, fontWeight: number, src: string) => ({ ...upright(fontFamily, fontWeight, src), fontStyle: "italic" as const });
export const FONTS = [
  upright("Poppins", 400, "poppins/v24/pxiEyp8kv8JHgFVrJJnedw"), italic("Poppins", 400, "poppins/v24/pxiGyp8kv8JHgFVrJJLufntF"),
  upright("Poppins", 500, "poppins/v24/pxiByp8kv8JHgFVrLGT9Z1JlEA"), italic("Poppins", 500, "poppins/v24/pxiDyp8kv8JHgFVrJJLmg1hVGdeL"),
  upright("Poppins", 700, "poppins/v24/pxiByp8kv8JHgFVrLCz7Z1JlEA"), italic("Poppins", 700, "poppins/v24/pxiDyp8kv8JHgFVrJJLmy15VGdeL"),
];
// Manrope has no italic; the upright file is registered for both styles because react-pdf throws when a style is missing.
const manrope = (fontWeight: number, src: string) => [upright("Manrope", fontWeight, src), italic("Manrope", fontWeight, src)];
export const FALLBACK_FONTS = [...manrope(400, "manrope/v20/xn7_YHE41ni1AdIRqAuZuw1Bx9mbZk79FO_F877xeQ"), ...manrope(700, "manrope/v20/xn7_YHE41ni1AdIRqAuZuw1Bx9mbZk4aE-_F877xeQ")];

let registered = false;
function registerFonts() {
  if (registered) return;
  for (const { fontFamily, ...font } of [...FONTS, ...FALLBACK_FONTS]) Font.register({ family: fontFamily, ...font });
  // react-pdf hyphenates with English patterns by default, which breaks names and course titles in the wrong places.
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
}

// react-pdf only fetches the weight and style named on the element that sets fontFamily, so every face the pages use is loaded up front.
// Every document also gets freshly parsed fonts. react-pdf keeps a failed font request for the lifetime of the page, so a retry would never reach the network again.
// It also reuses the parsed font, and fontkit caches a glyph the first time it is asked for: after one PDF with Î, the I it is built from is cached without
// its character and silently disappears from every later PDF in the same tab. The font files themselves come back from the browser's HTTP cache.
export async function loadFonts(fallback = false) {
  registerFonts();
  const sources = [...FONTS, ...(fallback ? FALLBACK_FONTS : [])].map(({ fontFamily, fontWeight, fontStyle }) => Font.getFont({ fontFamily, fontWeight, fontStyle }));
  for (const source of sources) { source.data = null; source.loadResultPromise = null; }
  await Promise.all(sources.map((source) => source.load()));
}

export const C = {
  navy: "#063a55", blue: "#1f6a8c", sky: "#6fb3d9", pale: "#eef4f8", line: "#d5e2ea", body: "#4b5e6a", onNavy: "#c9dce7", ink: "#0f1a22", white: "#ffffff",
  /** The "Important" strip on the apply page. */
  amber: "#fff4e2", amberInk: "#8a4b00",
  /** Legal small print on the navy footer. */
  onNavyDim: "#9fbbcb",
};
/** A4, with the templates' 18mm side margins: content runs from x = 51.02 to x = 544.26. */
export const PAGE = { w: 595.28, h: 841.89, x: 51.02, right: 544.26, inner: 493.24, top: 76.9, rule: 56.7, radius: 8.5 };

/** Small-caps label: upper case, wide tracking given in em as in the templates (0.18 eyebrow, 0.16 card label, 0.14 small line, 0.2 pill, 0.24 tagline). */
export const caps = (fontSize: number, em: number, color: string = C.blue, fontWeight = 500): Sx => ({ fontSize, fontWeight, color, letterSpacing: fontSize * em, lineHeight: 1.4, textTransform: "uppercase" });
const bi = (fontSize: number, color: string, lineHeight = 1.4): Sx => ({ fontSize, fontWeight: 700, fontStyle: "italic", color, lineHeight });

/** Type tokens at the templates' sizes. Spread or pass in a style array: <Text style={[T.body, { marginTop: 4 }]}>. */
export const T = {
  h1: { ...bi(37, C.navy, 1.062), letterSpacing: -0.34 }, title: bi(21, C.navy), bandTitle: bi(17, C.white), name: bi(15, C.navy), pageNo: bi(11, C.navy),
  eyebrow: caps(7.6, 0.18), label: caps(6.6, 0.16), meta: caps(8, 0.14),
  lead: { fontSize: 10.6, color: C.body, lineHeight: 1.5 }, intro: { fontSize: 9.3, color: C.body, lineHeight: 1.495 },
  h3: { fontSize: 10.5, fontWeight: 700, color: C.navy, lineHeight: 1.4 }, cardTitle: { fontSize: 10.4, fontWeight: 700, color: C.navy, lineHeight: 1.25 },
  value: { fontSize: 9.6, fontWeight: 700, color: C.navy, lineHeight: 1.4 }, strong: { fontWeight: 700, color: C.ink },
  body: { fontSize: 8.2, color: C.body, lineHeight: 1.45 }, small: { fontSize: 7.2, color: C.body, lineHeight: 1.35 }, note: { fontSize: 6.6, color: C.body, lineHeight: 1.4 },
} satisfies Record<string, Sx>;

const s = {
  page: { backgroundColor: C.white, fontFamily: "Poppins", fontSize: 8.2, color: C.body },
  sheet: { width: PAGE.w, height: PAGE.h - 0.01 },
  wordmark: { position: "absolute", left: PAGE.x, top: 31.2, width: 120.9, height: 12.41 },
  header: { position: "absolute", left: 184, right: PAGE.w - PAGE.right - 0.29, top: 31.5, textAlign: "right", fontSize: 7.2, letterSpacing: 0.29, lineHeight: 1.4, color: C.body },
  headerLabel: { fontWeight: 700, color: C.navy },
  rule: { position: "absolute", left: PAGE.x, top: PAGE.rule - 0.5, width: PAGE.inner, height: 0.5, backgroundColor: C.line },
  body: { position: "absolute", left: 0, top: 0, width: PAGE.w, height: PAGE.h, paddingTop: PAGE.top, paddingHorizontal: PAGE.x },
  footNote: { position: "absolute", left: PAGE.x, top: 806.8, width: 474, ...T.note },
  pageNo: { position: "absolute", right: PAGE.w - PAGE.right, top: 800.45, ...T.pageNo },
  pill: { fontSize: 5.9, fontWeight: 700, letterSpacing: 0.354, lineHeight: 1.4 },
} satisfies Record<string, Sx>;

// react-pdf's paginator mishandles a page whose children are all absolute, and a Page with wrap={false} shrinks to its content. So each page holds one
// unbreakable full-page box and everything is laid out inside it; it is a hair shorter than A4 so the paginator never sees it as too tall for the page.
function Sheet({ children }: { children?: ReactNode }) {
  return <Page size="A4" style={s.page}><View wrap={false} style={s.sheet}>{children}</View></Page>;
}

/** A page with no header or footer (the cover). Children are laid out from the page's top-left corner; use <Abs> for template coordinates. */
export function BlankPage({ children }: { children?: ReactNode }) {
  return <Sheet>{children}</Sheet>;
}

/** Pages 2-5: wordmark, "Student Offer · {Name} · {Campus}", hairline, and optionally the footer note and the two-digit page number.
 *  Children flow from (51.02, 76.9), the top of the eyebrow, in a 493.24pt column; an <Abs> child is placed in page coordinates. Nothing wraps to a new page. */
export function PageShell({ data, page, note, children }: { data: OfferData; page?: number; note?: string; children?: ReactNode }) {
  return <Sheet>
    <Image src={data.assets.wordmark} style={s.wordmark} />
    <Text style={[s.header, { fontFamily: data.nameFont }]}><Text style={s.headerLabel}>{data.header.label}</Text>{data.header.rest}</Text>
    <View style={s.rule} />
    <View style={s.body}>{children}</View>
    {note ? <Text style={s.footNote}>{note}</Text> : null}
    {page != null ? <Text style={s.pageNo}>{String(page).padStart(2, "0")}</Text> : null}
  </Sheet>;
}

/** Absolutely placed box. Inside PageShell or BlankPage, x and y are page coordinates: use a span's bbox x0, y0 from the metrics files for text. */
export function Abs({ x, y, w, h, style, children }: { x: number; y: number; w?: number; h?: number; style?: Sx; children?: ReactNode }) {
  return <View style={[{ position: "absolute", left: x, top: y }, w != null ? { width: w } : {}, h != null ? { height: h } : {}, style ?? {}]}>{children}</View>;
}

/** "01 · THE COURSES". As the first child of PageShell its baseline lands on the template's (y = 84.9). */
export function Eyebrow({ children, color, style }: { children: ReactNode; color?: string; style?: Sx }) {
  return <Text style={[T.eyebrow, color ? { color } : {}, style ?? {}]}>{children}</Text>;
}

/** 21pt bold italic page title. Directly after <Eyebrow> it sits where the templates put it (baseline y = 110.8). */
export function PageTitle({ children, style }: { children: ReactNode; style?: Sx }) {
  return <Text style={[T.title, { marginTop: 1.16 }, style ?? {}]}>{children}</Text>;
}

/** Text with bold runs: <RichText parts={data.cover.lead} style={T.lead} />. Bold runs take T.strong unless `bold` overrides it. */
export function RichText({ parts, style, bold }: { parts: Rich; style?: Sx; bold?: Sx }) {
  return <Text style={style ?? {}}>{parts.map((part, i) => typeof part === "string" ? part : <Text key={i} style={bold ?? T.strong}>{part.b}</Text>)}</Text>;
}

const PILL: Record<PatternTag, { box: Sx; text: Sx }> = {
  DAYTIME: { box: { backgroundColor: C.pale }, text: { color: C.blue } },
  EVENING: { box: { backgroundColor: C.navy }, text: { color: C.white } },
  // The outline sits outside the pill's nominal size, as in the templates.
  WEEKEND: { box: { backgroundColor: C.white, borderWidth: 0.6, borderColor: C.sky, margin: -0.6 }, text: { color: C.navy } },
};
// The pill's height comes from its padding around the 8.26pt line: a fixed height shorter than the line makes react-pdf drop the text.
const pillBox = (height: number, top: number, paddingHorizontal = 5.1): Sx => ({ paddingTop: top, paddingBottom: height - 8.26 - top, paddingHorizontal, borderRadius: 6, flexShrink: 0 });
/** DAYTIME (pale) / EVENING (navy) / WEEKEND (outlined) tag. size "legend" is the 10.8pt key under the intro, "row" the 9.7pt tag beside a study pattern. */
export function Pill({ tag, size = "row", style }: { tag: PatternTag; size?: "legend" | "row"; style?: Sx }) {
  return <View style={[size === "legend" ? pillBox(10.8, 1.2) : pillBox(9.7, 0.7), PILL[tag].box, style ?? {}]}><Text style={[s.pill, PILL[tag].text]}>{tag}</Text></View>;
}

/** The "YOUR CHOICE" marker for the course and route the student picked. Pair it with CHOICE.border on the card. */
export function ChoiceBadge({ style }: { style?: Sx }) {
  return <View style={[pillBox(10.8, 1.2, 6), { backgroundColor: C.blue, flexDirection: "row" }, style ?? {}]}>
    <Sparkle size={4.6} color={C.white} style={{ marginTop: 1.8, marginRight: 2.6 }} /><Text style={[s.pill, { color: C.white }]}>{CHOICE_BADGE}</Text>
  </View>;
}
/** Border of the chosen course card or Year 1 entry (the others use 0.6pt C.line). */
export const CHOICE = { border: { borderWidth: 1.4, borderColor: C.blue } satisfies Sx, tint: "#f4f9fc" };

/** Numbered circle. "solid": filled disc with a white number (journey steps 29.8/11.5 italic, tips 15/8, golden rules 13/7). "outline": 0.8pt ring with a matching number (cover, 22.7/10 italic in C.sky). */
export function NumberCircle({ n, size, fontSize, variant = "solid", color = C.navy, italic: slanted = false, style }: { n: number | string; size: number; fontSize: number; variant?: "solid" | "outline"; color?: string; italic?: boolean; style?: Sx }) {
  const solid = variant === "solid";
  return <View style={[{ width: size, height: size, borderRadius: size / 2, alignItems: "center", justifyContent: "center", flexShrink: 0 }, solid ? { backgroundColor: color } : { borderWidth: 0.8, borderColor: color }, style ?? {}]}>
    <Text style={{ fontSize, fontWeight: 700, fontStyle: slanted ? "italic" : "normal", color: solid ? C.white : color, lineHeight: 1.4 }}>{n}</Text>
  </View>;
}

// react-pdf does not pass fill/stroke down from <Svg>, so each shape takes the pen itself.
type Pen = { fill: "none"; stroke: string; strokeWidth: number; strokeLinecap: "round"; strokeLinejoin: "round" };
const ICONS = {
  cap: (p: Pen) => <><Path {...p} d="M2 9 L12 4 L22 9 L12 14 Z" /><Path {...p} d="M6 11 V16 C9 18.2 15 18.2 18 16 V11" /></>,
  shield: (p: Pen) => <><Path {...p} d="M12 3 L20 7 V12 C20 17 16.5 20 12 21 C7.5 20 4 17 4 12 V7 Z" /><Path {...p} d="M8.5 12 L10.8 14.4 L15.5 9.6" /></>,
  clock: (p: Pen) => <><Circle {...p} cx={12} cy={12} r={9} /><Path {...p} d="M12 7 V12 L15 14" /></>,
  calendar: (p: Pen) => <><Rect {...p} x={3} y={5} width={18} height={16} rx={2.5} ry={2.5} /><Path {...p} d="M3 10 H21 M8 3 V7 M16 3 V7" /></>,
  message: (p: Pen) => <Path {...p} d="M4 5 H20 V16 H9 L4 20 Z" />,
  book: (p: Pen) => <><Path {...p} d="M4 5 C7 4.2 10 4.2 12 6.2 C14 4.2 17 4.2 20 5 V19.3 C17 18.2 14 18.2 12 20.2 C10 18.2 7 18.2 4 19.3 Z" /><Path {...p} d="M12 6.2 V20.2" /></>,
  people: (p: Pen) => <><Circle {...p} cx={9.25} cy={8} r={3} /><Circle {...p} cx={17.2} cy={9.2} r={2.4} /><Path {...p} d="M3.3 20.2 C3.8 16.1 6.3 14.3 9.25 14.3 C12.2 14.3 14.7 16.1 15.2 20.2" /><Path {...p} d="M15.2 14.7 C17.7 14.5 20.2 16.1 20.7 19.8" /></>,
  check: (p: Pen) => <Path {...p} d="M5 12.5 L10 17.5 L19 7.5" />,
};
export type IconName = keyof typeof ICONS;
/** Line icon on a 24-unit grid; `stroke` is in grid units. Cover fact cards: size 17.6, stroke 1.7. PFF Day "assessed on" tiles: size 10.5, stroke 2. */
export function Icon({ name, size = 17.6, color = C.blue, stroke = 1.7, style }: { name: IconName; size?: number; color?: string; stroke?: number; style?: Sx }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" style={[{ flexShrink: 0 }, style ?? {}]}>{ICONS[name]({ fill: "none", stroke: color, strokeWidth: stroke, strokeLinecap: "round", strokeLinejoin: "round" })}</Svg>;
}

/** Four-point sparkle star (filled). Cover: 11.3 and 15.6 white; key dates card and navy footer: 12.5-13 white. */
export function Sparkle({ size, color = C.white, style }: { size: number; color?: string; style?: Sx }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" style={[{ flexShrink: 0 }, style ?? {}]}><Path fill={color} d="M12 0 C13.06 7.86 16.03 11.04 24 12 C16.03 12.96 13.06 16.14 12 24 C10.94 16.14 7.97 12.96 0 12 C7.97 11.04 10.94 7.86 12 0 Z" /></Svg>;
}

/** Small open circle used beside the sparkles (cover 5.7, last page 5.2). */
export function Ring({ size, color = C.white, style }: { size: number; color?: string; style?: Sx }) {
  return <View style={[{ width: size, height: size, borderRadius: size / 2, borderWidth: 0.8, borderColor: color, flexShrink: 0 }, style ?? {}]} />;
}

// Both bands are cut from an ellipse 822pt wide centred on the page; at the page edges its outline is 31% of the way from apex to centre line.
const EDGE = 1 - Math.sqrt(1 - (PAGE.w / 2 / 411) ** 2);
/** Full-width navy band from `top` to the bottom of the page (or `height`), placed absolutely on the page.
 *  "dome" (cover, top 470.6): highest in the middle, starting 30pt lower at the page edges. "bowl" (last page, top 626.2): highest at the edges, dipping 22.9pt in the middle. */
export function CurvedBand({ kind, top, height = PAGE.h - top, color = C.navy }: { kind: "dome" | "bowl"; top: number; height?: number; color?: string }) {
  const ry = kind === "dome" ? 96.4 : 73.7, y = kind === "dome" ? ry : -ry * (1 - EDGE);
  return <Svg width={PAGE.w} height={height} viewBox={`0 0 ${PAGE.w} ${height}`} style={{ position: "absolute", left: 0, top }}>
    <Path fill={color} d={`M -113.4 ${y} A 411 ${ry} 0 0 ${kind === "dome" ? 1 : 0} 708.7 ${y} V ${height} H -113.4 Z`} />
  </Svg>;
}
/** Depth of each band's curve, for placing content: the dome reaches full width 29.9pt below its top, the bowl is 22.9pt deep in the middle. */
export const BAND = { domeEdge: 96.4 * EDGE, bowlDip: 73.7 * EDGE };

/** White card with the templates' 0.6pt outline, 8.5pt corners and a 3.4pt coloured top edge (course cards: by university; cover facts: C.blue on C.pale with no outline). */
export function AccentCard({ accent, fill = C.white, outline = true, style, children }: { accent: string; fill?: string; outline?: boolean; style?: Sx; children?: ReactNode }) {
  return <View style={[{ borderRadius: PAGE.radius, backgroundColor: fill, overflow: "hidden" }, outline ? { borderWidth: 0.6, borderColor: C.line } : {}, style ?? {}]}>
    <View style={{ position: "absolute", left: -1, right: -1, top: -1, height: outline ? 3.8 : 4.4, backgroundColor: accent }} />{children}
  </View>;
}
