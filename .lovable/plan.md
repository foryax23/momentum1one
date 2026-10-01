# Momentum One — Cinematic Student Recruitment Funnel

Brand: **Momentum One** — "Building Momentum For Your Future". Logo: rocket launching from an open book under a deep teal starry dome. Partners in the pack include Green Valley Academy, University of Wolverhampton (UOW) and AUB. Courses: Business Management, Health & Social Care, Public Health with Foundation Year, Fashion Management and others.

## Visual direction
- A "launch" theme that matches the logo: a deep space-navy background with teal glow, drifting stars, and a rocket trail that moves as you go through the steps.
- Fonts: Space Grotesk / Sora for headings, Manrope for body text. Big, bold headline type.
- Motion: the logo assembles on load, the background moves slightly with scroll, the stars move a little with the cursor or phone tilt, each step slides in, and a "lift-off" moment plays when the form is submitted.
- Designed for phones first: thumb-sized buttons, one question per screen, swipe-style transitions. On desktop: a split layout with the cinematic scene on the left and the funnel on the right.

## Pages
1. **Home (/)**: the funnel sits inside the opening screen, with no extra click needed.
   - Headline: "Your degree starts here. Fully funded routes, top UK universities."
   - Step 1 starts right away (the first name field is visible on the opening screen).
   - Below the opening screen: partner universities, how it works (Apply, then PFF Day, then Offer, then Enrol), featured courses, testimonials (placeholder copy) and FAQ.
2. **Funnel steps** (one per screen, with a progress bar shaped like a rocket trail):
   1. Full name
   2. Closest city: tap-cards for the top 20 UK cities (London, Birmingham, Manchester, Leeds, Glasgow, Liverpool, Sheffield, Bristol, Edinburgh, Leicester, Coventry, Bradford, Nottingham, Cardiff, Belfast, Newcastle, Stoke, Southampton, Derby, Luton)
   3. Area of interest: Business, Health & Social Care, Public Health, Fashion, Not sure (optional)
   4. When they want to start: January 2027, later in 2027, just exploring (optional)
   5. Email and UK phone number, with checks, plus a consent tickbox
   6. Success: a lift-off animation, a personalised offer certificate preview, a **Download your offer (PDF)** button, and a note that the PDF has also been emailed to them.
3. **Admin (/admin)**: staff-only login.
   - A table of leads with search and filters (city, course, date), a detail view, status tags (New, Contacted, Applied, Enrolled), notes, and export to CSV.
   - Summary numbers: total leads, leads this week, top cities.

## Offer PDF (diploma style)
- Landscape A4 page with a cream background, a thin gold and teal border, guilloche corner patterns, and the Momentum One logo with a faint watermark.
- Title "Certificate of Pre-Approved Pathway", followed by the student's name, city, chosen course area, the target intake and a reference number such as MO-2027-00123.
- Benefits list, next steps (PFF Day), and the date issued.
- Signature block: **Robert, Director, Momentum One**, with a gold seal.
- The same PDF is emailed to the student automatically from a branded email template.

## Things needed from you (I can start without them)
- Robert's real signature as a photo or PNG. Until then I'll use an elegant script-style placeholder.
- Robert's surname and his exact title.
- A domain for sending emails (for example momentumone.co.uk). Emails need a verified sender, and I'll guide you through setting it up.
- The admin email address(es).
- Whether funding claims (student finance) can be mentioned. Until you confirm, I'll keep that wording neutral.

## Technical details
- Lovable Cloud: a `leads` table (name, email, phone, city, interest, intake, consent, status, notes, ref_code, created_at), with grants and RLS: anonymous visitors can only add a lead, and only admins can read or update.
- A `user_roles` table with an `app_role` enum and a `has_role()` function. `/admin` sits behind authentication and an admin role check. Email and password login.
- Lead submission runs through a server function with zod validation that inserts the lead and creates the ref code.
- PDF: generated in the browser with `@react-pdf/renderer` (logo and signature embedded) for the instant download. The same document is rendered on the server for the email attachment.
- Email: Lovable's built-in transactional email with a branded template and the PDF attached, available once the email domain is verified.
- Motion: `motion` (Framer Motion) for step transitions and layout animations, a CSS/canvas starfield, and gyroscope parallax on mobile. All motion respects `prefers-reduced-motion`.
- Logo copied into `src/assets`. Each route gets its own head() metadata.
