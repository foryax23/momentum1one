# Clearer immersive videos and a three-language public experience

## Goal
Keep the section videos visibly cinematic while blending them naturally into the page, and let students use the complete public journey in English, Romanian, or Spanish.

## Video refinement
- Keep the approved wide, immersive treatment for Courses, Campuses, and How It Works.
- Reduce the heavy navy veil so the motion, maps, labels, and imagery remain clearly visible.
- Replace the uniform fade with directional blending: a stronger readable zone behind copy, a clearer video zone away from copy, and a short soft transition into the white page below.
- Adjust each film independently because its composition differs, rather than applying one opacity setting to all three.
- Preserve full-width mobile cropping without returning to a square frame.
- Keep near-viewport playback, tab pausing, poster fallbacks, reduced-motion support, and data-saving behavior.

## Language system
- Add a compact **EN / RO / ES** selector in the main header and equivalent access on public account and legal pages.
- Default to English, remember the student’s choice on the device, and update the document language for accessibility.
- Build one typed translation catalogue and shared language provider so labels are not duplicated throughout the site.
- Translate the full public student experience:
  - homepage navigation, announcement, headings, supporting copy, buttons, statistics, FAQs, footer, and video-section overlays
  - all five onboarding steps, validation, consent choices, success state, PDF/download actions, and WhatsApp handoff copy
  - account sign-in, registration, password recovery, and invitation screens
  - secure public offer page and student-facing account shell labels
  - cookie banner and cookie preferences
  - privacy notice, cookie notice, website terms, and application disclaimer
  - personalised PDF offer labels and explanatory copy
- Keep names, email addresses, company details, reference codes, course titles, university names, campus names, official route names, and legal entity names unchanged where translation would make them inaccurate.
- Keep admin and advisor workspaces in English for this phase.
- Preserve the selected language when moving between public pages and returning from account or legal screens.

## Content quality
- Use natural Romanian and Spanish wording rather than word-for-word substitutions.
- Keep consent and legal meaning aligned across all languages, with no expanded claims or promises.
- Continue avoiding em dashes in all new copy.

## Validation
- Check the three blended video sections at 393 × 852 and 1280 × 1800 for visibility, text contrast, smooth edges, and correct playback.
- Complete the onboarding flow in EN, RO, and ES, including validation, submission success, offer actions, and WhatsApp handoff.
- Check public account recovery, cookie controls, legal pages, secure offer pages, and the generated PDF in every language.
- Confirm language choice persists across refreshes and page changes, with no text overflow or runtime errors.

## Technical details
- Extend the existing section-video presentation with per-film overlay and positioning settings.
- Add a client-safe locale context with typed keys and persisted preference; avoid adding a large internationalisation dependency for three fixed languages.
- Pass the active locale into the PDF and student-facing presentation paths without changing lead submission, account permissions, or admin behavior.
