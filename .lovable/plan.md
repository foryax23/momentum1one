# Rocket, premium student documents, email delivery and cinematic video treatments

## Goal
Use the supplied rocket artwork in the onboarding sequence, give every applicant a professional five-page offer and a separate diploma-style pathway certificate, deliver both from one private download page, and make each square film fully visible while its edges blend naturally into the page.

## 1. Rebuild the onboarding rocket from the supplied artwork
- Store the nine transparent PNG components through the project asset system and replace the current drawn rocket.
- Assemble the rocket from independently positioned layers so visible artwork, rather than each PNG canvas, determines sizing and alignment.
- Follow the supplied five-stage sequence:
  1. Hull and engine nozzle
  2. Nose cone and antenna
  3. Left fin, right fin and two landing feet
  4. Porthole
  5. Flame ignition
- Preserve the required depth order: fins and antenna behind the body, porthole in front, flame behind the engine collar.
- Give each part its own spring arrival. Animate the fins separately, pulse the flame from its top-centre anchor, enlarge the completed rocket, and keep the final lift-off and smoke sequence.
- Keep motion restrained for reduced-motion visitors and retain an accessible progress description.

## 2. Create two premium personalised documents
### Five-page student offer
- Redesign the existing offer with stronger editorial hierarchy, refined borders, folios, reference details, campus and course emphasis, deliberate whitespace and a more authentic document system.
- Vary the five page layouts instead of repeating the same card pattern.
- Continue using the verified campus and course catalogue as the source of truth. Unconfirmed dates remain clearly labelled as unconfirmed rather than invented.
- Preserve EN, RO and ES versions and ensure accented characters render correctly.

### One-page pathway certificate
- Add a separate diploma-style certificate personalised with the student name, selected course, route, campus, intake, issue date and reference.
- Include the transparent Momentum One logo, Robert’s signature treatment, a formal border, seal and restrained security-pattern details.
- Clearly label it as a personalised pathway certificate issued by Momentum One, not a university admission offer or academic qualification.

## 3. Upgrade the private download experience
- Expand the existing expiring private offer page into a document centre showing the applicant, course, campus and reference.
- Add separate download actions for the five-page offer and the pathway certificate.
- Keep both documents generated only in the browser so the public site remains stable.
- Use clear filenames containing the applicant reference, campus and document type.
- Update the post-onboarding success state so both documents are available immediately from the same secure page.

## 4. Send the documents by email through one secure page
- Configure a sender domain owned by Momentum One before enabling app email delivery.
- Scaffold a branded Momentum One confirmation email triggered only by that applicant’s completed onboarding.
- Include the applicant’s name, course, campus, reference and one prominent button opening the private document centre.
- Do not attach PDFs. The email service does not support attachments, so the private page is the supported and safer delivery method.
- Add duplicate-send protection and update the existing email status to sent, suppressed or failed without ever blocking lead creation, the on-screen downloads or WhatsApp follow-up.
- Keep the current expiring hashed-link protection and expose no additional student information.

## 5. Show every square film in full with a distinct edge effect
- Stop cropping the Courses, Campuses and How It Works films into wide background strips.
- Present each film at its full square aspect ratio beside its heading and copy, with only the outer margins blending into the surrounding navy surface.
- Give each section a unique treatment:
  - **Courses:** soft radial vignette with a subtle focus pulse.
  - **Campuses:** four-edge feather with a restrained map-grid glow.
  - **How It Works:** directional edge dissolve with a moving route-line accent.
- Keep the centre of every film clear and undimmed. Remove the current full-surface dark overlays.
- On phones, stack the complete square above the copy without clipping. On desktop, offset the film and text for a cinematic editorial layout.
- Preserve near-viewport loading, tab pausing, poster fallbacks, data-saving behaviour and reduced-motion support.

## Verification
- Check all five onboarding stages and final lift-off at 393 × 852 and 1280 × 1800.
- Confirm every supplied rocket component aligns cleanly with no transparent-canvas spacing errors.
- Generate both documents for every campus in EN, RO and ES, then visually inspect every page for clipping, overlap, missing accents, weak contrast and inaccurate content.
- Test immediate downloads, repeat downloads from the private page, invalid and expired links, and both filenames.
- After sender-domain setup, test a real completion email, the private-page button, duplicate protection and suppressed/failed delivery states.
- Confirm all three square films remain fully visible on phone and desktop, and that reduced-motion mode uses the same blended poster compositions.
- Check the current preview for build, runtime, console and network errors.

## Technical details
- Keep the existing validated lead submission, hashed offer tokens, catalogue, private field projection and browser-only document loader.
- Add the certificate to the same lazy-loaded document module and reuse one typed document-data model for both downloads.
- Use the managed app-email sender only after domain configuration. No email queue, attachment service or new email database tables will be created.
- Use semantic design tokens for the website treatments and preserve existing role, consent and security boundaries.
