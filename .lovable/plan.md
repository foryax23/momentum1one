# Momentum One homepage: cinematic video and richer conversion content

## Goal
Turn the current polished page into a more convincing student-recruitment experience, with a lightweight looping motion-graphics background on the first screen and more useful information throughout. Keep the live five-step application, personalised offer, course slider, campus matching and admin tools.

## Creative direction
- **Motion style:** cinematic editorial motion graphics, not stock footage and not a generic technology animation.
- Build the loop around Momentum One's real service: a UK map, moving route lines toward the five campus cities, course imagery, subtle document and graduation motifs, and the brand mark.
- Use the existing navy, teal, gold and white palette with Poppins and Figtree.
- Keep the central area calm enough for the headline and application form to remain readable.
- Use a seamless 10 to 14 second loop, silent, with slow camera drift and restrained depth. No captions or interface controls inside the video.

## First screen
- Replace the plain background with the new full-width looping video, with a poster image shown before playback and for reduced-motion or data-saving visitors.
- Add a strong contrast layer so every field and headline remains clear.
- Preserve the application as the main action. On phones, frame the video as a shallow visual backdrop so the form begins within the first screen rather than being pushed far down.
- Add concise, factual proof points near the headline: five campuses, seven degree choices, Foundation and Year 1 routes where available, personalised offer after applying, and advisor support.
- Do not autoplay audio. Pause when the tab is hidden, respect reduced motion, and avoid loading the full video until needed.

## Richer information that helps students decide
1. **Course slider upgrade**
   - Keep one representative image per subject.
   - Add route, awarding university, available campuses, study-pattern summary and an immediate course-to-form action.
   - Retain swipe, arrows, keyboard navigation, autoplay pause and the hover/tap zoom treatment.

2. **Course comparison**
   - Add a compact comparison area for degree, entry route, campuses and typical study pattern.
   - Let students send any available option directly into the application form.
   - Source every value from the existing offer catalogue, with unconfirmed information labelled “To be confirmed”.

3. **Eligibility and documents**
   - Expand the current funding area into a practical eligibility checker-style section covering Foundation Year, Year 1, work or family commitments, funding guidance and the documents commonly required.
   - Keep language advisory, not a promise of admission or funding.

4. **Campus detail**
   - Enrich each campus card with its available courses and confirmed schedules, while preserving the current photo-led zoom interaction.
   - Add a direct “See my options” action that selects the city or campus context in the application.

5. **Application journey and trust**
   - Expand the journey with what happens after each stage, including advisor contact, document preparation, PFF Day and the personalised offer.
   - Add a clear “What you receive” band for the five-page offer and WhatsApp follow-up.
   - Use only verifiable partner names, course facts and process information. No invented testimonials, rankings, success rates, dates, fees or contact details.

6. **Decision support and FAQs**
   - Organise FAQs into entry requirements, schedules, finance, documents and what happens after applying.
   - Add contextual actions back to the application or WhatsApp without duplicating the same large call-to-action in every section.

## Motion and interaction system
- Reuse one entrance language: short upward reveals, gentle image scale and one curved wipe motif drawn from the video.
- Add subtle depth to course and campus imagery, progress feedback in comparison areas, and a refined scroll-linked journey line.
- Keep all effects still and fully usable when reduced motion is enabled.
- Replace any remaining generic decoration with service-specific map routes, course photography, document details and campus information.

## WhatsApp status
- The Momentum One WhatsApp connection is linked to this project.
- Meta currently reports the welcome template as **PENDING**, not approved yet. The existing “Waiting for Meta approval” state and resend control will remain.
- After Meta changes it to approved, verify a real onboarding welcome, inbound student reply, bot answer and admin-queue handover before presenting WhatsApp as fully live.

## Validation
- Check the first screen and the complete page at phone and desktop sizes.
- Confirm video autoplay, seamless looping, poster fallback, reduced-motion behaviour and no layout movement while loading.
- Complete the application from a course and campus action to confirm preselection, lead submission, offer download and WhatsApp success action still work.
- Confirm all richer course and campus facts match the shared catalogue and no public copy uses em dashes.

## Technical details
- Produce the hero loop as a Remotion motion-graphics composition, render MP4 plus WebM where practical, and store the web asset through the project asset flow.
- Add a dedicated video-background component using `<video muted autoPlay loop playsInline>` with an imported poster and source pointer.
- Keep the application and text as semantic foreground content rather than baking them into the video.
- Extend the existing home-section components instead of adding a second content source; `offer-catalog.ts` remains authoritative.
- Preserve route metadata, backend behaviour, offer generation and admin logic.
