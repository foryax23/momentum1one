# Home page upgrade: more dynamic, more professional, built to convert

## Goal
Swap the generic, template-like blocks for polished, image-led sections that build trust and push visitors to the sign-up form. Keep the current brand colours, fonts, logo and 5-step form.

## What changes

1. **Courses as a moving slide deck (main feature)**
   - A horizontal deck of large course cards, one for each of the 7 degrees. Each card has its own photo (business, marketing, health and care, fashion, events, psychology, public health).
   - It swipes on phones, and on desktop it has arrows, drag and keyboard controls. It slides along slowly by itself and stops when you hover over it or touch it.
   - When you hover over or tap a card, the photo zooms in slowly, the card lifts, and a panel slides up with the university, the entry routes (Foundation Year, Year 1), the campuses and a "Check my options" button that jumps to the form with that course picked.
   - Dots and a progress bar at the bottom show where you are in the deck.

2. **First screen that converts**
   - A sharper headline, plus a line of trust points: "Funding may be available", "Local campuses", "Foundation routes, no A-levels needed". I'll only use claims we can actually back up.
   - A row of partner university names, set in a clean monochrome style.
   - The sign-up form stays as the main card on the right on desktop, and on top on phones.

3. **New sections that convert**
   - **Who it's for:** 3 to 4 short student types (career changers, parents returning to study, people without A-levels), each with a photo, showing visitors "this is for me".
   - **Animated numbers band:** 7 degrees, 5 campuses, 3 partner universities, 1 minute to apply. Only real numbers, no made-up stats.
   - **Campuses as photo cards:** each card has a city photo, a distance hint and the courses taught there. They zoom on hover just like the course deck.
   - **How it works:** a timeline that fills in as you scroll.
   - **Finance and eligibility:** a plain-English explainer with "an advisor confirms this" wording, which deals with the biggest worry before it stops someone.
   - **FAQ:** a smoother accordion, plus a "Still unsure? Message us on WhatsApp" link.
   - **Final sign-up band:** a full-width photo strip with the call to action.

4. **Remove the generic "AI" look**
   - Remove the filler icon grids, the evenly spaced card rows and vague benefit lines. Replace them with real photos, specific copy and tighter type.
   - No em dashes, no invented testimonials, dates, fees or contact details.

5. **Motion and polish everywhere**
   - Sections appear as you scroll, photos drift slightly as you scroll, buttons react when pressed, and the header gets smaller once you scroll down.
   - People who turn off motion on their device get a still version.
   - On phones: big touch targets, the sign-up button stays at the bottom of the screen, and photos load only when needed so the page stays fast.

## Content I will create
- I'll generate about 12 to 14 photos (7 courses, 5 campus cities, a few student types) in one consistent, realistic style. You can swap in real photos later.
- The student-type groups and finance wording will be drafted by me, and I'll point them out so you can check them.

## Testing
- Check the course deck works by swiping, hovering, dragging, arrows and "Check my options" on phone and desktop sizes.
- Make sure the full sign-up flow still works and the course picked from the deck is pre-selected.

## Technical details
- New components: `CourseDeck` (motion/react with drag constraints, auto-advance paused on hover or focus, scale 1.08 on image hover), `CampusCards`, `AudienceStrip`, `StatsBand` (count-up when in view), `ScrollTimeline` (useScroll progress).
- Course data comes from the existing `offer-catalog.ts` instead of the separate list in index.tsx, so the content can't drift apart.
- The deck's "Check my options" sets a `course` query or hash, and the funnel reads it to pre-select the course once the campus is known.
- Images go in `src/assets/courses/*` and `src/assets/campuses/*` as JPGs and lazy-load. No new heavy libraries.
- Head metadata stays as it is.
