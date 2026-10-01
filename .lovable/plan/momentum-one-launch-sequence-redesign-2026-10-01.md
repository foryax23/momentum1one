# Momentum One launch-sequence redesign

## Goal
Rebuild the public page in the visual style of the uploaded design while keeping Momentum One's working lead funnel, campus matching, protected lead storage, admin area, and downloadable pathway certificate.

## Design direction
- Replace the current notebook and slide-deck treatment with the uploaded light launch-sequence style.
- Use a crisp white and mist background, deep navy structure, teal and sky accents, plus a small warm flame accent.
- Switch the public page typography to Poppins for expressive italic headings and Figtree for body text.
- Keep the transparent Momentum One logo on a clean light surface.
- Use soft 10 to 22px corners, fine blue-grey borders, restrained shadows, pill labels, and generous mobile spacing.
- Remove paper rules, book-page backgrounds, gold editorial decoration, page numbers, and the fixed slide rail from the public page.

## Page structure
1. Add the compact sticky header from the reference with the logo and a clear sign-up action.
2. Rebuild the first screen as a two-column desktop layout and stacked mobile layout:
   - “Launch your UK degree” message, supporting proof points, and partner summary.
   - The live four-step funnel as the dominant interactive card.
3. Add the curved deep-navy horizon section with subtle stars and four concise student benefits.
4. Present all seven current degrees as compact, scannable rows with awarding institution and campus pills.
5. Present the five current campuses as clean cards with course counts and intake information.
6. Convert the current process into a connected five-step journey suited to desktop and mobile.
7. Keep the FAQ content in the simpler bordered accordion style from the reference.
8. Add the final sign-up band, footer, and mobile sticky call-to-action.
9. Remove the placeholder student testimonials rather than carrying invented quotes into the new design.

## Funnel experience
- Restyle the existing secure four-step funnel to match the uploaded card exactly in composition and density.
- Add the animated rocket progress track, step dots, labels, directional transitions, validation feedback, and polished success launch animation.
- Keep name, city, phone, WhatsApp preference, email, consent, draft saving, source tracking, and nearest-campus calculation.
- Keep the pathway PDF download on success and retain the existing server-validated lead submission.
- Do not use the uploaded public Google Apps Script endpoint because the app already has protected lead storage and an admin leads view.

## Motion and accessibility
- Use short, purposeful entrance, progress, chip-selection, campus-match, rocket, star, and section-reveal animations.
- Preserve reduced-motion support, keyboard focus states, readable contrast, large mobile controls, and safe-area spacing.
- Avoid em dashes in all public copy.

## Technical details
- Update the semantic colour, radius, shadow, and font tokens in the global design system.
- Load Poppins and Figtree through the page head.
- Recompose the public route and funnel using the existing React, Motion, icon, map, lead, and PDF modules.
- Leave the protected admin workflow functionally unchanged, apart from any small token updates needed for visual consistency.
- Verify the complete funnel on mobile and desktop, check the success and PDF download states, and confirm a clean build with no browser errors.
