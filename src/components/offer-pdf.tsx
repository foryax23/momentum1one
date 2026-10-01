import { Document, Page, View, Text, Image, Font, StyleSheet, pdf } from "@react-pdf/renderer";
import type { LeadResult } from "@/lib/funnel";
import { campusName, coursesForCampus } from "@/lib/offer-catalog";
import type { Locale } from "@/lib/i18n";

// The built-in PDF fonts are Latin-1 only (no ă ș ț), so the site's own families are embedded instead.
// Manrope carries Latin Extended, Cyrillic and Greek; Sora (headings) is Latin Extended only, so applicant names are always set in Manrope.
const GSTATIC = "https://fonts.gstatic.com/s";
const FONTS = [
  { fontFamily: "Manrope", fontWeight: 400, src: `${GSTATIC}/manrope/v20/xn7_YHE41ni1AdIRqAuZuw1Bx9mbZk79FO_F877xeQ.ttf` },
  { fontFamily: "Manrope", fontWeight: 700, src: `${GSTATIC}/manrope/v20/xn7_YHE41ni1AdIRqAuZuw1Bx9mbZk4aE-_F877xeQ.ttf` },
  { fontFamily: "Sora", fontWeight: 700, src: `${GSTATIC}/sora/v17/xMQOuFFYT72X5wkB_18qmnndmSe1mU-DKQc.ttf` },
];
for (const { fontFamily, ...font } of FONTS) Font.register({ family: fontFamily, ...font });
// react-pdf hyphenates with English patterns by default, which breaks Romanian and Spanish words in the wrong places.
Font.registerHyphenationCallback((word) => [word]);

const INK = "#063A55", TEAL = "#1F6A8C", GOLD = "#FFB547", ICE = "#F3F8FB", LINE = "#D6E4EA", BODY = "#365462";
const s = StyleSheet.create({
  page: { backgroundColor: "#FFFFFF", color: INK, fontFamily: "Manrope", padding: 42, fontSize: 9.5 },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: LINE, paddingBottom: 10 },
  logo: { width: 72, height: 60, objectFit: "contain" }, meta: { fontSize: 7, color: TEAL, textAlign: "right", lineHeight: 1.6 },
  eyebrow: { fontSize: 8, color: TEAL, letterSpacing: 2, marginTop: 28 }, h1: { fontFamily: "Sora", fontWeight: 700, fontSize: 24, lineHeight: 1.15, marginTop: 8 },
  h2: { fontFamily: "Sora", fontWeight: 700, fontSize: 18, marginTop: 16, marginBottom: 9 }, lead: { color: BODY, fontSize: 11, lineHeight: 1.55, marginTop: 10 },
  band: { backgroundColor: INK, color: "#FFFFFF", padding: 20, marginTop: 20 }, bandTitle: { fontFamily: "Sora", fontWeight: 700, fontSize: 18 }, bandText: { fontSize: 9.5, lineHeight: 1.55, marginTop: 8 },
  grid: { flexDirection: "row", gap: 8, marginTop: 18 }, stat: { flex: 1, borderWidth: 1, borderColor: LINE, padding: 12, minHeight: 64 },
  label: { fontSize: 6.5, color: TEAL, letterSpacing: 1.2 }, value: { fontWeight: 700, fontSize: 10, marginTop: 4, lineHeight: 1.3 },
  card: { borderWidth: 1, borderColor: LINE, paddingVertical: 9, paddingHorizontal: 12, marginTop: 6 }, selected: { borderColor: GOLD, borderWidth: 2, backgroundColor: ICE },
  course: { fontWeight: 700, fontSize: 10.5 }, small: { color: BODY, fontSize: 8, marginTop: 3, lineHeight: 1.4 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: LINE, paddingVertical: 8 }, num: { width: 28, fontFamily: "Sora", fontWeight: 700, color: GOLD, fontSize: 16 }, rowBody: { flex: 1 }, rowTitle: { fontWeight: 700, fontSize: 10 },
  chip: { backgroundColor: ICE, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, fontSize: 7, marginRight: 5, marginTop: 5 },
  footer: { position: "absolute", left: 42, right: 42, bottom: 24, borderTopWidth: 1, borderTopColor: LINE, paddingTop: 7, flexDirection: "row", justifyContent: "space-between", color: BODY, fontSize: 6.5 },
  callout: { borderLeftWidth: 4, borderLeftColor: GOLD, backgroundColor: ICE, padding: 12, marginTop: 14 },
  sign: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 18 },
  // The PNG has transparent margins around the ink, so the rule is pulled up to sit under the pen stroke.
  signature: { width: 170, height: 85, marginBottom: -14 }, signRule: { width: 170, borderTopWidth: 1, borderTopColor: INK },
  issued: { alignItems: "flex-end" }, hair: { fontSize: 0.1 },
});

// Name and title as the client brief and plan docs give them; no surname is known. "Director" reads the same in English, Romanian and Spanish.
const DIRECTOR = { name: "Robert", title: "DIRECTOR, MOMENTUM ONE" };
const PFF_TIMES = [["9:00", "9:30"], ["9:30", "10:00"], ["10:00", "11:00"], ["11:00", "12:00"], ["12:00", "12:30"], ["12:30", "14:00"], ["14:00", "16:00"]] as const;
const PRETASK = ["4", "150", "20%", "2"] as const;
const REQUIRED_DOCUMENTS = 4;

type Pair = [string, string];
// One copy table for the whole document. {tokens} are filled in by fill(). Course titles, universities, campuses and timetable patterns come from the catalogue as they are.
const en = {
  offer: "PERSONALISED STUDENT OFFER", footer: "MOMENTUM ONE · BUILDING MOMENTUM FOR YOUR FUTURE", campus: "{campus} CAMPUS", tbc: "to be confirmed", courseTbc: "Course to be confirmed",
  routes: { "Foundation Year": "Foundation Year", "Year 1": "Year 1" } as Record<string, string>, intakes: {} as Record<string, string>,
  pathway: "STUDY IN THE UK · PERSONALISED COURSE PATHWAY", launch: "Launch your degree in {campus}", intro: "Prepared for {name}. Your selected pathway is {course} with {route}, subject to application review and assessment.",
  student: "STUDENT", course: "COURSE", route: "ENTRY ROUTE", intake: "YOUR INTAKE",
  fit: "A university degree that fits your life", fitText: "Flexible study patterns · UK honours degree · Personal application support · Foundation route available",
  conversation: "Your place starts with one conversation", guide: "We guide you from application to enrolment, step by step.", issued: "ISSUED", reference: "REFERENCE",
  important: "Important", disclaimer: "This personalised pathway is not a confirmed university admission offer. Eligibility is confirmed after document review and the required assessment.",
  courses: "THE COURSES", options: "Your course options in {campus}", selectedHint: "Your chosen course is highlighted. Study patterns are based on current campus information and may change before enrolment.",
  apply: "HOW TO APPLY", journey: "Your journey to enrolment",
  steps: [["Apply with Momentum One", "Send your documents. We check everything and submit your application."], ["Application check", "Admissions reviews your documents and invites you to the PFF pre-task."], ["Complete your pre-task", "Answer 4 questions of 150 words each. You can resubmit once if needed."], ["Attend your PFF Day", "A one-day assessment at the {campus} campus."], ["Get your offer and enrol", "Pass the assessment, complete the checks and receive enrolment confirmation."]] satisfies Pair[],
  keyDates: "Key dates", keyDatesText: "Your intake: {intake} · PFF Day dates: to be confirmed. Start early so there is time to complete and, if needed, resubmit your pre-task.",
  ready: "GET READY", checklist: "Your documents checklist", required: "REQUIRED", helpful: "HELPFUL",
  documents: ["Proof of identity", "Share code if your passport is not British", "Proof of address dated within three months of the course start", "Duolingo English certificate", "CV, if available", "Qualification certificates, if available"],
  pretask: "Your pre-task: get it right first time", pretaskStats: ["questions", "words each", "maximum similarity", "attempts at most"],
  pretaskTips: "Write in your own words. Include accurate course details. Finish before PFF Day. Scan both sides of identity documents clearly.",
  pff: "THE PFF DAY", expect: "Your PFF Day: what to expect", pffIntro: "A one-day campus assessment of your skills, motivation and readiness for university.", to: " to ",
  pffDay: [["Arrive on campus", "Complimentary tea and coffee"], ["Check-in", "Pre-task and ID check"], ["Session 1", "Introduction and identifying barriers"], ["Session 2", "Student support and campus tour"], ["Lunch break", ""], ["Session 3", "Research and communication"], ["Session 4", "Final reflection and close of the day"]] satisfies Pair[],
  rules: "Golden rules", ruleList: ["Be on time", "Complete the pre-task", "Bring your ID", "One PFF Day per intake"],
  closing: "Launch your future with Momentum One", closingText: "We will check your documents, submit your application and support you all the way to enrolment.",
  legal: "Momentum One is an independent student recruitment agency. Course details are provided by partner colleges and awarding universities. Dates and timetables are to be confirmed and may change. Foundation Year admission depends on meeting all requirements and passing the PFF Day.",
};
const PDF_COPY: Record<Locale, typeof en> = {
  en,
  ro: {
    offer: "OFERTĂ PERSONALIZATĂ PENTRU STUDENT", footer: "MOMENTUM ONE · AVÂNT PENTRU VIITORUL TĂU", campus: "CAMPUSUL {campus}", tbc: "de confirmat", courseTbc: "Program de confirmat",
    routes: { "Foundation Year": "Foundation Year", "Year 1": "Anul 1" }, intakes: { "January 2027": "ianuarie 2027", "Later in 2027": "mai târziu în 2027" },
    pathway: "STUDII ÎN REGATUL UNIT · TRASEU PERSONALIZAT", launch: "Începe-ți studiile în {campus}", intro: "Pregătită pentru {name}. Traseul ales este {course}, ruta {route}, sub rezerva analizei dosarului și a evaluării.",
    student: "STUDENT", course: "PROGRAM", route: "RUTĂ DE ADMITERE", intake: "SESIUNEA TA",
    fit: "O diplomă universitară adaptată vieții tale", fitText: "Orar flexibil · Diplomă de licență britanică · Sprijin personal la aplicare · Rută Foundation disponibilă",
    conversation: "Locul tău începe cu o conversație", guide: "Te ghidăm de la aplicare până la înmatriculare, pas cu pas.", issued: "EMISĂ LA", reference: "REFERINȚĂ",
    important: "Important", disclaimer: "Acest traseu personalizat nu este o ofertă confirmată de admitere la universitate. Eligibilitatea se confirmă după verificarea documentelor și după evaluarea obligatorie.",
    courses: "PROGRAMELE", options: "Opțiunile tale de studiu în {campus}", selectedHint: "Programul ales este evidențiat. Orarele se bazează pe informațiile actuale ale campusului și se pot modifica înainte de înmatriculare.",
    apply: "CUM APLICI", journey: "Drumul tău către înmatriculare",
    steps: [["Aplici prin Momentum One", "Ne trimiți documentele. Verificăm totul și depunem aplicația pentru tine."], ["Verificarea aplicației", "Biroul de admitere îți analizează documentele și te invită să completezi tema pregătitoare PFF (pre-task)."], ["Completezi tema pregătitoare", "Răspunzi la 4 întrebări, cu câte 150 de cuvinte fiecare. O poți retrimite o singură dată, dacă este nevoie."], ["Participi la Ziua PFF", "O evaluare de o zi în campusul {campus}."], ["Primești oferta și te înmatriculezi", "Treci evaluarea, finalizezi verificările și primești confirmarea înmatriculării."]],
    keyDates: "Date importante", keyDatesText: "Sesiunea ta de admitere: {intake} · Zilele PFF: de confirmat. Începe din timp, ca să poți completa și, dacă este nevoie, retrimite tema pregătitoare.",
    ready: "PREGĂTEȘTE-TE", checklist: "Lista ta de documente", required: "OBLIGATORIU", helpful: "UTIL",
    documents: ["Dovada identității", "Share code, dacă pașaportul tău nu este britanic", "Dovada adresei, emisă cu cel mult trei luni înainte de începerea cursului", "Certificat de limba engleză Duolingo", "CV, dacă ai", "Diplome și certificate de studii, dacă ai"],
    pretask: "Tema pregătitoare: fă-o bine din prima", pretaskStats: ["întrebări", "cuvinte fiecare", "similitudine maximă", "încercări cel mult"],
    pretaskTips: "Scrie cu propriile tale cuvinte. Include detalii corecte despre program. Termină înainte de Ziua PFF. Scanează clar ambele fețe ale actelor de identitate.",
    pff: "ZIUA PFF", expect: "Ziua PFF: la ce să te aștepți", pffIntro: "O evaluare de o zi, în campus, a abilităților, a motivației și a pregătirii tale pentru universitate.", to: " – ",
    pffDay: [["Sosirea în campus", "Ceai și cafea din partea casei"], ["Înregistrare", "Tema pregătitoare și verificarea actului de identitate"], ["Sesiunea 1", "Introducere și identificarea obstacolelor"], ["Sesiunea 2", "Sprijin pentru studenți și turul campusului"], ["Pauză de prânz", ""], ["Sesiunea 3", "Cercetare și comunicare"], ["Sesiunea 4", "Reflecție finală și încheierea zilei"]],
    rules: "Reguli de aur", ruleList: ["Vino la timp", "Completează tema pregătitoare", "Adu actul de identitate", "O singură Zi PFF pe sesiune de admitere"],
    closing: "Lansează-ți viitorul cu Momentum One", closingText: "Îți verificăm documentele, depunem aplicația și te sprijinim până la înmatriculare.",
    legal: "Momentum One este o agenție independentă de recrutare a studenților. Detaliile programelor sunt furnizate de colegiile partenere și de universitățile care acordă diplomele. Datele și orarele urmează să fie confirmate și se pot modifica. Admiterea în Foundation Year depinde de îndeplinirea tuturor cerințelor și de promovarea Zilei PFF.",
  },
  es: {
    offer: "OFERTA PERSONALIZADA PARA ESTUDIANTES", footer: "MOMENTUM ONE · IMPULSO PARA TU FUTURO", campus: "CAMPUS DE {campus}", tbc: "por confirmar", courseTbc: "Curso por confirmar",
    routes: { "Foundation Year": "Foundation Year", "Year 1": "Año 1" }, intakes: { "January 2027": "enero de 2027", "Later in 2027": "más adelante en 2027" },
    pathway: "ESTUDIOS EN EL REINO UNIDO · RUTA PERSONALIZADA", launch: "Empieza tu grado en {campus}", intro: "Preparada para {name}. La ruta elegida es {course} con {route}, sujeta a la revisión de la solicitud y a la evaluación.",
    student: "ESTUDIANTE", course: "CURSO", route: "VÍA DE ACCESO", intake: "TU CONVOCATORIA",
    fit: "Un grado universitario que encaja con tu vida", fitText: "Horarios flexibles · Grado universitario británico · Apoyo personal con la solicitud · Ruta Foundation disponible",
    conversation: "Tu plaza empieza con una conversación", guide: "Te acompañamos desde la solicitud hasta la matrícula, paso a paso.", issued: "EMITIDA EL", reference: "REFERENCIA",
    important: "Importante", disclaimer: "Esta ruta personalizada no es una oferta confirmada de admisión universitaria. La elegibilidad se confirma tras revisar los documentos y completar la evaluación requerida.",
    courses: "LOS CURSOS", options: "Tus opciones de estudio en {campus}", selectedHint: "El curso elegido aparece destacado. Los horarios se basan en la información actual del campus y pueden cambiar antes de la matrícula.",
    apply: "CÓMO SOLICITAR", journey: "Tu camino hacia la matrícula",
    steps: [["Solicita tu plaza con Momentum One", "Envíanos tus documentos. Lo revisamos todo y presentamos tu solicitud."], ["Revisión de la solicitud", "El equipo de admisiones revisa tus documentos y te invita a completar la tarea previa del PFF (pre-task)."], ["Completa tu tarea previa", "Responde a 4 preguntas de 150 palabras cada una. Puedes volver a enviarla una vez si hace falta."], ["Asiste a tu Día PFF", "Una evaluación de un día en el campus de {campus}."], ["Recibe tu oferta y matricúlate", "Supera la evaluación, completa las comprobaciones y recibe la confirmación de matrícula."]],
    keyDates: "Fechas clave", keyDatesText: "Tu convocatoria: {intake} · Días PFF: por confirmar. Empieza pronto para tener tiempo de completar y, si hace falta, volver a enviar tu tarea previa.",
    ready: "PREPÁRATE", checklist: "Tu lista de documentos", required: "OBLIGATORIO", helpful: "ÚTIL",
    documents: ["Documento de identidad", "Share code, si tu pasaporte no es británico", "Justificante de domicilio con fecha de los tres meses anteriores al inicio del curso", "Certificado de inglés de Duolingo", "CV, si lo tienes", "Títulos y certificados de estudios, si los tienes"],
    pretask: "Tu tarea previa: hazla bien a la primera", pretaskStats: ["preguntas", "palabras cada una", "similitud máxima", "intentos como máximo"],
    pretaskTips: "Escribe con tus propias palabras. Incluye datos correctos del curso. Termina antes del Día PFF. Escanea con claridad ambas caras de tus documentos de identidad.",
    pff: "EL DÍA PFF", expect: "Tu Día PFF: qué esperar", pffIntro: "Una evaluación de un día en el campus sobre tus habilidades, tu motivación y tu preparación para la universidad.", to: " a ",
    pffDay: [["Llegada al campus", "Té y café de cortesía"], ["Registro", "Tarea previa y comprobación de identidad"], ["Sesión 1", "Introducción e identificación de obstáculos"], ["Sesión 2", "Apoyo al estudiante y visita al campus"], ["Pausa para comer", ""], ["Sesión 3", "Investigación y comunicación"], ["Sesión 4", "Reflexión final y cierre de la jornada"]],
    rules: "Reglas de oro", ruleList: ["Llega puntual", "Completa la tarea previa", "Trae tu documento de identidad", "Un solo Día PFF por convocatoria"],
    closing: "Impulsa tu futuro con Momentum One", closingText: "Revisamos tus documentos, presentamos tu solicitud y te acompañamos hasta la matrícula.",
    legal: "Momentum One es una agencia independiente de captación de estudiantes. La información de los cursos la facilitan los centros asociados y las universidades que otorgan los títulos. Las fechas y los horarios están por confirmar y pueden cambiar. La admisión al Foundation Year depende de cumplir todos los requisitos y de superar el Día PFF.",
  },
};
const fill = (text: string, vars: Record<string, string>) => text.replace(/\{(\w+)\}/g, (token, key: string) => vars[key] ?? token);
const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function Header({ lead, page, origin, offer }: { lead: LeadResult; page: number; origin: string; offer: string }) {
  return <View style={s.top} fixed><Image src={`${origin}/logo.png`} style={s.logo} /><Text style={s.meta}>{lead.ref_code}{"\n"}{offer} · {String(page).padStart(2, "0")}/05</Text></View>;
}
function Footer({ tagline, campus }: { tagline: string; campus: string }) { return <View style={s.footer} fixed><Text>{tagline}</Text><Text>{campus}</Text></View>; }

// With hyphenation off, a name part too wide for the 96pt STUDENT box would print over the next column. Such a name may wrap after its own hyphens
// (the hair-width space is a break point that adds no second hyphen), and a part that is still too wide wraps in even pieces that do take one.
// The width is estimated from average Manrope Bold advances at 10pt (narrow letters, wide letters, capitals, the rest), which is within a few points.
const tooWide = (part: string) => Array.from(part).reduce((width, char) => width + (/[fijlrtI'.-]/.test(char) ? 3.5 : /[mwMW]/.test(char) ? 8.8 : char === char.toLowerCase() ? 5.9 : 6.7), 0) > 96;
function namePieces(part: string) {
  if (!tooWide(part)) return [part];
  const chars = Array.from(part), size = Math.ceil(chars.length / Math.ceil(chars.length / 12)), pieces: string[] = [];
  while (chars.length > size) pieces.push(chars.splice(0, size).join(""));
  return [...pieces, chars.join("")];
}
function StudentName({ name }: { name: string }) {
  if (!name.split(" ").some(tooWide)) return <Text style={s.value}>{name}</Text>;
  const parts = name.split("-");
  return <Text style={s.value} hyphenationCallback={namePieces}>{parts.map((part, i) => i < parts.length - 1 ? <Text key={i}>{`${part}-`}<Text style={s.hair}>{" "}</Text></Text> : part)}</Text>;
}

export function OfferDocument({ lead, locale = "en", origin = window.location.origin }: { lead: LeadResult; origin?: string; locale?: Locale }) {
  const c = PDF_COPY[locale];
  const campus = campusName(lead.nearest_campus), courses = coursesForCampus(lead.nearest_campus);
  const chosen = courses.find((c) => c.title === lead.selected_course && c.route === lead.study_route) ?? courses[0];
  const issued = new Date(lead.created_at).toLocaleDateString(locale === "ro" ? "ro-RO" : locale === "es" ? "es-ES" : "en-GB", { day: "numeric", month: "long", year: "numeric" });
  const routeName = (route: string) => c.routes[route] ?? route;
  // "Just exploring" is a funnel answer, not an intake, so it reads as not yet confirmed.
  const intake = !lead.intake || lead.intake === "Just exploring" ? c.tbc : c.intakes[lead.intake] ?? lead.intake;
  const facts = [[c.student, lead.full_name], [c.course, chosen?.title ?? c.courseTbc], [c.route, routeName(lead.study_route ?? "Foundation Year")], [c.intake, cap(intake)]];
  const header = (page: number) => <Header lead={lead} page={page} origin={origin} offer={c.offer} />, footer = <Footer tagline={c.footer} campus={fill(c.campus, { campus: campus.toUpperCase() })} />;
  return <Document title={`Momentum One Offer ${lead.ref_code}`} author="Momentum One" language={locale}>
    <Page size="A4" style={s.page}>{header(1)}
      <Text style={s.eyebrow}>{c.pathway}</Text><Text style={s.h1}>{fill(c.launch, { campus })}</Text>
      <Text style={s.lead}>{fill(c.intro, { name: lead.full_name, course: chosen?.title ?? c.courseTbc, route: routeName(lead.study_route ?? "Foundation Year") })}</Text>
      <View style={s.grid}>{facts.map(([label, value], i) => <View key={label} style={s.stat}><Text style={s.label}>{label}</Text>{i === 0 ? <StudentName name={lead.full_name} /> : <Text style={s.value}>{value}</Text>}</View>)}</View>
      <View style={s.band}><Text style={s.bandTitle}>{c.fit}</Text><Text style={s.bandText}>{c.fitText}</Text></View>
      <Text style={s.h2}>{c.conversation}</Text><Text style={s.lead}>{c.guide}</Text>
      <View style={s.sign} wrap={false}>
        <View><Image src={`${origin}/signature.png`} style={s.signature} /><View style={s.signRule} /><Text style={s.value}>{DIRECTOR.name}</Text><Text style={[s.label, { marginTop: 2 }]}>{DIRECTOR.title}</Text></View>
        <View style={s.issued}><Text style={s.label}>{c.issued}</Text><Text style={s.value}>{issued}</Text><Text style={[s.label, { marginTop: 8 }]}>{c.reference}</Text><Text style={s.value}>{lead.ref_code}</Text></View>
      </View>
      <View style={s.callout}><Text style={s.course}>{c.important}</Text><Text style={s.small}>{c.disclaimer}</Text></View>{footer}
    </Page>
    <Page size="A4" style={s.page}>{header(2)}<Text style={s.eyebrow}>01 · {c.courses}</Text><Text style={s.h1}>{fill(c.options, { campus })}</Text><Text style={s.lead}>{c.selectedHint}</Text>
      {courses.map((course) => <View key={course.id} style={[s.card, course.id === chosen?.id ? s.selected : {}]}><Text style={s.label}>{course.university.toUpperCase()}</Text><Text style={s.course}>{course.title}</Text><Text style={s.small}>{routeName(course.route)} · {course.patterns.join(" · ")}</Text></View>)}{footer}
    </Page>
    <Page size="A4" style={s.page}>{header(3)}<Text style={s.eyebrow}>02 · {c.apply}</Text><Text style={s.h1}>{c.journey}</Text>
      {c.steps.map(([title, body], i) => <View key={title} style={s.row}><Text style={s.num}>{i + 1}</Text><View style={s.rowBody}><Text style={s.rowTitle}>{title}</Text><Text style={s.small}>{fill(body, { campus })}</Text></View></View>)}
      <View style={s.callout}><Text style={s.course}>{c.keyDates}</Text><Text style={s.small}>{fill(c.keyDatesText, { intake })}</Text></View>{footer}
    </Page>
    <Page size="A4" style={s.page}>{header(4)}<Text style={s.eyebrow}>03 · {c.ready}</Text><Text style={s.h1}>{c.checklist}</Text>
      {c.documents.map((item, i) => <View key={item} style={[s.row, { alignItems: "center" }]}><Text style={[s.label, { width: 72, letterSpacing: 0.6 }]}>{i < REQUIRED_DOCUMENTS ? c.required : c.helpful}</Text><Text style={[s.rowTitle, s.rowBody]}>{item}</Text></View>)}
      <Text style={s.h2}>{c.pretask}</Text><View style={s.grid}>{c.pretaskStats.map((label, i) => <View key={label} style={s.stat}><Text style={[s.value, { fontSize: 18 }]}>{PRETASK[i]}</Text><Text style={s.small}>{label}</Text></View>)}</View>
      <View style={s.callout}><Text style={s.small}>{c.pretaskTips}</Text></View>{footer}
    </Page>
    <Page size="A4" style={s.page}>{header(5)}<Text style={s.eyebrow}>04 · {c.pff}</Text><Text style={s.h1}>{c.expect}</Text><Text style={s.lead}>{c.pffIntro}</Text>
      {c.pffDay.map(([title, body], i) => <View key={title} style={s.row}><Text style={[s.rowTitle, { width: 95 }]}>{PFF_TIMES[i]?.join(c.to)}</Text><View style={s.rowBody}><Text style={s.rowTitle}>{title}</Text>{body && <Text style={s.small}>{body}</Text>}</View></View>)}
      <Text style={s.h2}>{c.rules}</Text><View style={{ flexDirection: "row", flexWrap: "wrap" }}>{c.ruleList.map((rule) => <Text key={rule} style={s.chip}>{rule}</Text>)}</View>
      <View style={s.band}><Text style={s.bandTitle}>{c.closing}</Text><Text style={s.bandText}>{c.closingText}</Text></View>
      <Text style={[s.small, { marginTop: 12 }]}>{c.legal}</Text>{footer}
    </Page>
  </Document>;
}

// Every document gets freshly parsed fonts. react-pdf keeps a failed font request for the lifetime of the page, so a retry would never reach the network again.
// It also reuses the parsed font, and fontkit caches a glyph the first time it is asked for: after one PDF with Î, the I it is built from is cached without
// its character and silently disappears from every later PDF in the same tab. The font files themselves come back from the browser's HTTP cache.
async function loadFonts() {
  const sources = FONTS.map((font) => Font.getFont(font));
  for (const source of sources) { source.data = null; source.loadResultPromise = null; }
  await Promise.all(sources.map((source) => source.load()));
}

export async function downloadOffer(lead: LeadResult, locale: Locale = "en") {
  await loadFonts();
  const blob = await pdf(<OfferDocument lead={lead} locale={locale} />).toBlob();
  const url = URL.createObjectURL(blob), a = document.createElement("a");
  const campus = campusName(lead.nearest_campus).replace(/\s+/g, "-");
  const course = (lead.selected_course ?? "Course").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
  a.href = url; a.download = `Momentum-One-${lead.ref_code}-${campus}-${course}.pdf`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 2000);
}