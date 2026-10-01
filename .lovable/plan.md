# Momentum One redesign: Editorial Academic slides

The site moves from the dark space look to a light editorial look, like a printed university prospectus. It follows the "Editorial academic hero" direction you picked, with the colours (Paper & Ink + Teal), fonts (Sora + Manrope) and full-screen slide layout you chose.

## Look and feel
- **Colours:** paper #f5f3ee, stone #e8e4dd, ink navy #0c2340, teal #2a7f9e. Gold #b8923a appears only on certificate and success moments.
- **Fonts:** Sora for headings, Manrope for body text.
- **Background:** faint ruled notebook lines with a red margin line. On some slides it changes to a dotted UK map that links the 20 cities, or to soft open-book page textures. Every background relates to studying.
- **Logo:** your real logo file everywhere, on a transparent background with no white circle behind it. I will trim the empty space around it so it sits sharp in the header, the footer, the admin pages and the PDF.
- **Copy:** no em dashes anywhere. I will rewrite every line in short, confident British English.
- **Icons:** all generic icons and emoji are replaced by a custom hand-drawn set in ink and teal. The set covers an open book, a mortarboard, a campus building, a map pin, a passport, a calendar, a rocket, a seal, a phone and an envelope.

## Home page as a slide deck
Each section fills the screen and snaps into place as you scroll. A slide counter (01 / 06) and a progress line sit along the edge. Each slide reveals itself with a masked text wipe and a page-turn motion.

1. **Opening slide:** header with the logo and links (Partners, Process, Courses). A pill reading "January 2027 intake", then the headline "Building Momentum For Your Future", a short intro and a line of student avatars. The onboarding card sits on the right on desktop and below the text on phones, with a teal top edge and a gold seal in the corner.
2. **Partners:** names of the partner universities appear one by one, set like an academic list.
3. **How it works:** 4 numbered chapters (Apply, Prepare, PFF Day, Enrol). Each gets an illustration that draws itself as you scroll.
4. **Courses:** cards styled like prospectus pages, with campus and duration.
5. **Students:** pull-quote testimonials in large type.
6. **FAQ and final call to action:** ends with a "Get my offer" button that scrolls back to the form.

## Onboarding animations, one per step
- **Name:** a book opens and your name is written in ink across the page as you type.
- **City:** a UK map outline with the 20 cities. Tapping a city chip drops a pin on the map with a small bounce.
- **Course:** illustrated cards for each subject (ledger for Business, heart and hands for Health and Social Care, globe for Public Health, hanger for Fashion). The chosen card flips.
- **Start date:** a calendar page flips to the chosen month.
- **Contact:** an envelope folds closed when both fields are valid.
- **Submit:** the logo rocket lifts off the book, leaves an ink trail, and the certificate rises into view sealed with gold.

## Certificate PDF upgrade
- Engraved double border with fine line patterns in each corner, and a cream paper background.
- The full logo, clean and transparent, plus a faint watermark of the rocket and book.
- Serif title "Certificate of Pre-Approved Pathway", the student's name in a large italic serif, and the course, intake, city and reference number set in a row.
- A short "Your next steps" strip (Advisor call, Documents, PFF Day, Enrol).
- A gold embossed seal with ring text, Robert's signature, and a QR-style reference block that shows the reference number.

## Admin pages
The admin and sign-in pages switch to the same paper look, with the transparent logo and the new icons.

## Technical details
- Rewrite the colour and font settings for the paper and ink theme, and add the ruled-paper and UK-map backgrounds as reusable styles.
- Process the logo into a trimmed transparent PNG (`src/assets/logo.png` and `public/logo.png`) and remove the white circle behind it in every component.
- New `src/components/icons.tsx` with custom SVG line icons, replacing lucide and emoji in the home page, funnel, auth and admin.
- `src/components/uk-map.tsx`: an SVG outline of the UK with city coordinates for the pin animation.
- Use CSS scroll-snap for the slides, Motion `whileInView` for the reveals, and `AnimatePresence` with a separate illustration for each step. All motion respects reduced-motion settings.
- Remove the starfield component.
- Rework `offer-pdf.tsx` using react-pdf SVG primitives (Svg, Path, Circle) for the borders, seal and patterns.
- Add a grep check so no em dash characters remain in the source.
