import type { ReactNode } from "react";
import { Page, View, Text, Image, Font, Svg, Path, Circle, Rect, type Styles } from "@react-pdf/renderer";
import type { OfferData, PatternTag, Rich } from "./data";
import { CHOICE_BADGE } from "./data";

// Shared look of the offer PDF, measured from the client's A4 templates. Every length is in PDF points, from the top-left of the page.
// Text sits with its baseline 1.05 × fontSize below the top of its box whatever the lineHeight, and lineHeight × fontSize is the distance between baselines.

export type Sx = Styles[string];

// The built-in PDF fonts are Latin-1 only (no ă ș ț), so the template's own family is embedded. These are the Latin + Latin Extended builds
// (css?family=Poppins:…&subset=latin,latin-ext); the plain css?family files are Latin only. They hold the same 350 characters in every face: no Cyrillic, Greek
// or Vietnamese, and not every Latin Extended letter (no Ħ, Ŋ, Ơ, Ư). Manrope (679 characters, the same in both weights) takes over for a name that needs them.
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
async function load(fonts: typeof FONTS) {
  registerFonts();
  const sources = fonts.map(({ fontFamily, fontWeight, fontStyle }) => Font.getFont({ fontFamily, fontWeight, fontStyle }));
  for (const source of sources) { source.data = null; source.loadResultPromise = null; }
  await Promise.all(sources.map((source) => source.load()));
}
/** Poppins, for every document. */
export const loadFonts = () => load(FONTS);
/** Manrope, only for a name with a character Poppins lacks (see hasGlyph). */
export const loadFallbackFonts = () => load(FALLBACK_FONTS);
/** Whether a family has a glyph for `char`, read from the parsed font file; false while the family is not loaded. One face answers for the family (see FONTS). */
export function hasGlyph(fontFamily: string, char: string) {
  try {
    const font = Font.getFont({ fontFamily, fontWeight: 400, fontStyle: "normal" }).data as { hasGlyphForCodePoint?: (codePoint: number) => boolean } | null;
    return font?.hasGlyphForCodePoint?.(char.codePointAt(0) ?? 0) ?? false;
  } catch { return false; }
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
    <Text style={s.header}><Text style={s.headerLabel}>{data.header.label}</Text>{data.header.name ? " · " : ""}<Text style={{ fontFamily: data.nameFont }}>{data.header.name}</Text>{data.header.rest}</Text>
    <View style={s.rule} />
    <View style={s.body}>{children}</View>
    {note ? <Text style={s.footNote}>{note}</Text> : null}
    {page != null ? <Text style={s.pageNo}>{String(page).padStart(2, "0")}</Text> : null}
  </Sheet>;
}

/** Absolutely placed box. Inside PageShell or BlankPage, x and y are page coordinates: for text, the top-left of the template's text box. */
export function Abs({ x, y, w, style, children }: { x: number; y: number; w?: number; style?: Sx; children?: ReactNode }) {
  return <View style={[{ position: "absolute", left: x, top: y }, w != null ? { width: w } : {}, style ?? {}]}>{children}</View>;
}

/** "01 · THE COURSES". As the first child of PageShell its baseline lands on the template's (y = 84.9). */
export function Eyebrow({ children, style }: { children: ReactNode; style?: Sx }) {
  return <Text style={[T.eyebrow, style ?? {}]}>{children}</Text>;
}

/** 21pt bold italic page title. Directly after <Eyebrow> it sits where the templates put it (baseline y = 110.8). */
export function PageTitle({ children, style }: { children: ReactNode; style?: Sx }) {
  return <Text style={[T.title, { marginTop: 1.16 }, style ?? {}]}>{children}</Text>;
}

/** Text with bold runs: <RichText parts={data.cover.lead} style={T.lead} />. Bold runs take T.strong unless `bold` overrides it. */
export function RichText({ parts, style, bold }: { parts: Rich; style?: Sx | Sx[]; bold?: Sx | undefined }) {
  return <Text style={style ?? {}}>{parts.map((part, i) => typeof part === "string" ? part : <Text key={i} style={bold ?? T.strong}>{part.b}</Text>)}</Text>;
}

type Face = { fontWeight?: number; fontStyle?: "normal" | "italic" };
type Measured = { unitsPerEm: number; layout: (text: string) => { advanceWidth: number } };
/** Width of `text` in em in one of the Poppins faces (or of `fontFamily`, for the student's name), from the font data react-pdf draws with (loadFonts has parsed it
 *  before a page renders); null when that data cannot be reached. */
export function textEm(text: string, { fontWeight = 400, fontStyle = "normal" }: Face = {}, fontFamily = "Poppins"): number | null {
  try {
    const font = Font.getFont({ fontFamily, fontWeight, fontStyle }).data as Measured | null;
    return font ? font.layout(text).advanceWidth / font.unitsPerEm : null;
  } catch { return null; }
}

// react-pdf balances the lines of a paragraph (Knuth-Plass) and squeezes the spaces of a line by up to a third to pull one more word onto it, so its
// paragraphs break at other words than the templates' and some lines come out tight. The templates were laid out by a browser, which fills each line at its
// natural width and then breaks. Paragraphs are broken that way here and each line is printed as its own Text.
type TextStyle = Sx & { fontSize: number };
/** The lines <Para> prints for `parts` in a column `width` wide, or null when the text cannot be measured. */
export function breakLines(parts: Rich | string, width: number, style: TextStyle): Rich[] | null {
  type Token = { text: string; bold: boolean; w: number };
  const face: Face = { fontWeight: typeof style.fontWeight === "number" ? style.fontWeight : 400, fontStyle: style.fontStyle === "italic" ? "italic" : "normal" }, fontSize = style.fontSize;
  const tokens: Token[] = [];
  for (const part of typeof parts === "string" ? [parts] : parts) {
    const bold = typeof part !== "string";
    for (const text of (bold ? part.b : part).match(/\s+|\S+/g) ?? []) {
      const w = textEm(text, bold ? { ...face, fontWeight: 700 } : face);
      if (w == null) return null;
      tokens.push({ text, bold, w: w * fontSize });
    }
  }
  const sum = (items: Token[]) => items.reduce((total, item) => total + item.w, 0);
  const lines: Token[][] = [[]];
  let used = 0, gap: Token[] = [], word: Token[] = [];
  const place = () => {
    const line = lines[lines.length - 1];
    if (!line || !word.length) return;
    if (line.length && used + sum(gap) + sum(word) > width) { lines.push(word); used = sum(word); }
    else { used += (line.length ? sum(gap) : 0) + sum(word); line.push(...(line.length ? gap : []), ...word); }
    gap = []; word = [];
  };
  for (const token of tokens) { if (token.text.trim()) word.push(token); else { place(); gap.push(token); } }
  place();
  return lines.map((line) => line.reduce<{ text: string; bold: boolean }[]>((runs, { text, bold }) => {
    const last = runs[runs.length - 1];
    if (last && last.bold === bold) last.text += text; else runs.push({ text, bold });
    return runs;
  }, []).map(({ text, bold }) => bold ? { b: text } : text));
}

/** A paragraph `width` wide that breaks where the templates do; use it for any text that can run to a second line. `style` goes on every line, `box` on the
 *  paragraph. If the text cannot be measured it is left to react-pdf's own wrapping. */
export function Para({ parts, width, style, bold, box }: { parts: Rich | string; width: number; style: TextStyle; bold?: Sx; box?: Sx }) {
  const lines = breakLines(parts, width, style);
  // A line gets a little more room than the measure, so one that fills it exactly is never wrapped a second time.
  return <View style={[{ width }, box ?? {}]}>{lines ? lines.map((line, i) => <RichText key={i} parts={line} style={[style, { width: width + 6 }]} bold={bold} />) : <RichText parts={typeof parts === "string" ? [parts] : parts} style={style} bold={bold} />}</View>;
}

const PILL: Record<PatternTag, { box: Sx; text: Sx }> = {
  DAYTIME: { box: { backgroundColor: C.pale }, text: { color: C.blue } },
  EVENING: { box: { backgroundColor: C.navy }, text: { color: C.white } },
  // The outline adds to the pill's size, as in the templates: 12 high in the legend, 10.9 beside a study pattern.
  WEEKEND: { box: { backgroundColor: C.white, borderWidth: 0.6, borderColor: C.sky }, text: { color: C.navy } },
};
// The pill's height comes from its padding around the 8.26pt line: a fixed height shorter than the line makes react-pdf drop the text.
const pillBox = (height: number, top: number, paddingHorizontal = 5.1): Sx => ({ paddingTop: top, paddingBottom: height - 8.26 - top, paddingHorizontal, borderRadius: 6, flexShrink: 0 });
/** Outer width of each tag beside a study pattern, outline included. */
export const PILL_WIDTH: Record<PatternTag, number> = { DAYTIME: 39.1, EVENING: 38.5, WEEKEND: 42.5 };
/** DAYTIME (pale) / EVENING (navy) / WEEKEND (outlined) tag. size "legend" is the 10.8pt key under the intro, "row" the 9.7pt tag beside a study pattern. */
export function Pill({ tag, size = "row" }: { tag: PatternTag; size?: "legend" | "row" }) {
  return <View style={[size === "legend" ? pillBox(10.8, 1.2) : pillBox(9.7, 0.7), PILL[tag].box]}><Text style={[s.pill, PILL[tag].text]}>{tag}</Text></View>;
}

/** The "YOUR CHOICE" marker for the course and route the student picked. Pair it with CHOICE.border on the card. */
export function ChoiceBadge({ style }: { style?: Sx }) {
  return <View style={[pillBox(10.8, 1.2, 6), { backgroundColor: C.blue, flexDirection: "row" }, style ?? {}]}>
    <Sparkle size={4.6} style={{ marginTop: 1.8, marginRight: 2.6 }} /><Text style={[s.pill, { color: C.white }]}>{CHOICE_BADGE}</Text>
  </View>;
}
/** Border of the chosen course card or Year 1 entry (the others use 0.6pt C.line). */
export const CHOICE = { border: { borderWidth: 1.4, borderColor: C.blue } } satisfies Record<string, Sx>;

/** Filled disc with a white number: journey steps 29.8/11.5 italic (35.4/13 on the large layout), pre-task rules 17/8, golden rules 13/7. */
export function NumberCircle({ n, size, fontSize, color = C.navy, italic: slanted = false, style }: { n: number | string; size: number; fontSize: number; color?: string; italic?: boolean; style?: Sx }) {
  return <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: "center", justifyContent: "center", flexShrink: 0 }, style ?? {}]}>
    <Text style={{ fontSize, fontWeight: 700, fontStyle: slanted ? "italic" : "normal", color: C.white, lineHeight: 1.4 }}>{n}</Text>
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
};
export type IconName = keyof typeof ICONS;
/** Line icon on a 24-unit grid; `stroke` is in grid units. Cover fact cards: size 17.6, stroke 1.7. PFF Day "assessed on" tiles: size 10.5, stroke 2. */
export function Icon({ name, size = 17.6, stroke = 1.7, style }: { name: IconName; size?: number; stroke?: number; style?: Sx }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" style={[{ flexShrink: 0 }, style ?? {}]}>{ICONS[name]({ fill: "none", stroke: C.blue, strokeWidth: stroke, strokeLinecap: "round", strokeLinejoin: "round" })}</Svg>;
}

/** White four-point sparkle star. Cover: 11.3 and 15.6; key dates card and navy footer: 12.5-13. */
export function Sparkle({ size, style }: { size: number; style?: Sx }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" style={[{ flexShrink: 0 }, style ?? {}]}><Path fill={C.white} d="M12 0 C13.06 7.86 16.03 11.04 24 12 C16.03 12.96 13.06 16.14 12 24 C10.94 16.14 7.97 12.96 0 12 C7.97 11.04 10.94 7.86 12 0 Z" /></Svg>;
}

/** Small open white circle beside the sparkles. `size` is the outer diameter: cover 6.5, last page 6. */
export function Ring({ size }: { size: number }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 0.8, borderColor: C.white }} />;
}

// Both bands are cut from an ellipse 822pt wide centred on the page; at the page edges its outline is 31% of the way from apex to centre line.
const EDGE = 1 - Math.sqrt(1 - (PAGE.w / 2 / 411) ** 2);
/** Full-width navy band from `top` to the bottom of the page, placed absolutely on the page.
 *  "dome" (cover, top 470.6): highest in the middle, starting 30pt lower at the page edges. "bowl" (last page, top 626.2): highest at the edges, dipping 22.9pt in the middle. */
export function CurvedBand({ kind, top }: { kind: "dome" | "bowl"; top: number }) {
  const height = PAGE.h - top, ry = kind === "dome" ? 96.4 : 73.7, y = kind === "dome" ? ry : -ry * (1 - EDGE);
  return <Svg width={PAGE.w} height={height} viewBox={`0 0 ${PAGE.w} ${height}`} style={{ position: "absolute", left: 0, top }}>
    <Path fill={C.navy} d={`M -113.4 ${y} A 411 ${ry} 0 0 ${kind === "dome" ? 1 : 0} 708.7 ${y} V ${height} H -113.4 Z`} />
  </Svg>;
}

const OUTLINE = { borderWidth: 0.6, borderColor: C.line };
/** Card with the templates' 8.5pt corners and 3.4pt coloured top edge; `width` is its outer width. Course cards: accent by university on white, with the default
 *  outline or CHOICE.border. Cover fact cards: C.blue on C.pale with `border={null}`.
 *  The edge is drawn as the templates' renderer draws a top border: it follows the corners and stops on their diagonal, where the side border takes over and tapers down. */
export function AccentCard({ accent, width, fill = C.white, border = OUTLINE, style, children }: { accent: string; width: number; fill?: string; border?: { borderWidth: number; borderColor: string } | null; style?: Sx; children?: ReactNode }) {
  const R = PAGE.radius, top = 3.4, side = border?.borderWidth ?? 0, rx = R - side, ry = R - top;
  // a: where the corner's diagonal meets the outer arc; p: where it meets the inner one.
  const a = R * (1 - Math.SQRT1_2), p = R - 1 / Math.hypot(1 / rx, 1 / ry);
  const taper = (x: (v: number) => number, sweep: 0 | 1) => `M${x(a)} ${a} A${R} ${R} 0 0 ${sweep} ${x(0)} ${R} H${x(side)} A${rx} ${ry} 0 0 ${1 - sweep} ${x(p)} ${p} Z`;
  return <View style={[{ width, borderRadius: R, backgroundColor: fill, flexShrink: 0 }, border ?? {}, style ?? {}]}>
    {/* Absolute children are placed from inside the border. */}
    <Svg width={width} height={R} viewBox={`0 0 ${width} ${R}`} style={{ position: "absolute", left: -side, top: -side }}>
      {border ? <Path fill={border.borderColor} d={`${taper((v) => v, 0)} ${taper((v) => width - v, 1)}`} /> : null}
      <Path fill={accent} d={`M${a} ${a} A${R} ${R} 0 0 1 ${R} 0 H${width - R} A${R} ${R} 0 0 1 ${width - a} ${a} L${width - p} ${p} A${rx} ${ry} 0 0 0 ${width - R} ${top} H${R} A${rx} ${ry} 0 0 0 ${p} ${p} Z`} />
    </Svg>{children}
  </View>;
}
