# Momentum One experience and account upgrade

## Direction

Use the selected **Professional recruitment mobile experience** as the structural reference, adapted to Momentum One’s real offer and existing brand.

- Keep deep navy, teal, warm gold, Poppins headings and Figtree body text.
- Make the experience more assured and editorial: stronger spacing rhythm, sharper hierarchy, cleaner borders, controlled depth and fewer repetitive pill/card patterns.
- Do not copy invented prototype claims such as 98% success, 50+ campuses, 24/7 support, visa concierge or guaranteed outcomes.
- Keep the transparent logo, real course catalogue, five campuses, three awarding universities and January 2027 intake wording.
- Keep public copy free of em dashes.

## 1. Rebuild the homepage system

- Refine the header into a compact, session-aware navigation with clear routes to courses, campuses, the application journey and account access.
- Improve the first screen while retaining the current headline and the live application as the main action.
- Replace small or inconsistent calls to action with one coherent button system: strong teal primary actions, restrained navy secondary actions, clear icon alignment, stable dimensions and tactile pressed states.
- Tighten typography across every section: fewer italic blocks, stronger Poppins hierarchy, more readable Figtree body copy and consistent labels.
- Standardise corners, borders, shadows, focus states and section spacing through shared design tokens and existing UI controls.
- Remove excessive blank transitions and repeated container treatments. Use full-width editorial bands to create pace.

## 2. Upgrade the onboarding experience

- Preserve the current five questions, campus matching, course preselection, validation, draft saving, consent, offer generation and WhatsApp handoff.
- Redesign the form as a premium guided application with:
  - a clearer progress header and plain-language step title
  - larger country selector and phone controls
  - more visual city and course choices
  - selected-state summaries before continuing
  - concise inline validation rather than weak disabled-only feedback
  - professional forward and back transitions tied to the user’s action
  - a calm preparation state while the lead and offer are created
- Upgrade the success screen into a clear next-actions view: offer ready, application reference, account creation, WhatsApp handoff and what happens next.
- Keep reduced-motion support and verify keyboard, touch and small-phone use.

## 3. Add the uploaded promotional video

- Upload the supplied 720 × 1280, 19.4-second Momentum One video through the project’s CDN asset flow rather than committing the binary.
- Place it in a dedicated editorial feature between the course/audience content and the application journey.
- Present it as a tall 9:16 media object with a restrained layered frame, soft navy shadow and surrounding copy that connects the video to adult learners and local study.
- Autoplay muted, loop continuously, play inline and avoid visible controls. Pause only when the browser tab is hidden. Show a poster frame when reduced motion is requested or playback is unavailable.
- Keep the existing quiet hero background film. The uploaded text-led promo becomes the focused mid-page story, where its vertical format reads naturally.

## 4. Improve “How it works”

Replace the current simple text timeline with an image-led five-stage journey using the verified process:

1. Check your options and receive the personalised information pack.
2. Choose whether to continue on WhatsApp or speak with an advisor.
3. Confirm personal details and prepare the relevant documents.
4. Complete the pre-task and attend PFF Day.
5. Enrol after the application and assessment are approved.

- On phones, use a connected vertical sequence with an animated progress line and one active stage at a time.
- On desktop, use a wider editorial journey with alternating media and content, avoiding five identical cards.
- Each stage reveals purpose, what the student does and what Momentum One does.
- Keep the language factual and never imply guaranteed admission.

## 5. Improve “After you apply”

Turn the current four equal blocks into an outcome-focused section showing what the student actually receives:

- personalised five-page course information
- a clear application reference and status
- advisor contact and WhatsApp choice
- guidance on details, documents and PFF Day
- optional creation of a student account after submission

Use the uploaded video’s visual language, stronger numbered states and one focused action. Avoid unsupported promises.

## 6. Create role-based accounts

### Roles and security

- Keep roles in the separate role table and add a dedicated `advisor` role. Treat the existing standard user role as the student account role.
- Keep admin privileges separate. No role is stored on a profile or lead record.
- Keep the existing protected route gate, then route authenticated users to the correct dashboard from their server-validated role.
- Replace open staff registration. Advisor accounts can only be invited by an admin.

### Student account after applying

- On the success screen, offer **Create my account** with the submitted email already filled in.
- The student sets a password and confirms their email before private application data becomes visible.
- After verified sign-in, securely link unclaimed applications matching that verified email to the student’s user ID.
- Create a protected student dashboard showing only the chosen first-version scope:
  - application reference
  - chosen course, route and campus
  - current application stage
  - a visual progress timeline
  - the next expected action and advisor-contact state
- Students can only read their own linked application. They cannot change internal status, advisor notes or other students’ records.

### Advisor account and dashboard

- Add admin-only advisor invitation and role assignment.
- Add advisor assignment to leads so each advisor sees assigned students plus the shared WhatsApp waiting queue they are permitted to handle.
- Build a focused advisor dashboard with assigned applications, waiting-for-advisor priority, student details, WhatsApp conversation, document review state, internal notes and controlled status updates.
- Keep the admin dashboard for all leads, advisor invitations, assignment and oversight.
- Enforce every private read and update in database access rules and authenticated server functions, not only in the interface.

## 7. Refresh account and dashboard presentation

- Replace the current paper-style sign-in and admin visuals with the selected navy, teal and clean-white system.
- Make the sign-in page role-neutral and polished. Successful sign-in sends students, advisors and admins to their correct area.
- Add consistent dashboard navigation, responsive summary panels, empty/loading/error states and phone-friendly lead views instead of relying on a wide table.
- Use the existing design-system buttons and inputs throughout.

## Technical implementation

- Add database fields for student ownership and advisor assignment, extend the role enum safely, and add strict grants and row-level access rules in the same migration.
- Use authenticated server functions for student linking, dashboard reads, advisor invitations and assignments. Use privileged access only after validating admin authority.
- Add named protected routes for `/student`, `/advisor` and `/admin`; do not create a second route for `/`.
- Keep offer rendering client-only and preserve the existing WhatsApp webhook, document storage and secure offer-link boundaries.
- Record the role-routing and ownership model in the project architecture notes.

## Verification

- Exercise the complete onboarding on phone and desktop, including city, course, international prefix, submission, PDF and account creation prompt.
- Verify the uploaded video loops, stays muted and inline, displays its fallback and does not obscure copy.
- Test student signup, email confirmation path, sign-in, ownership linking and isolation from another student’s application.
- Test an admin inviting an advisor, assigning a lead, and the advisor seeing only permitted work.
- Verify unauthorised access is blocked for student, advisor and admin data.
- Check the rebuilt homepage, How it works, After you apply, auth and both dashboards at mobile and desktop sizes with no runtime or build errors.

## Delivery order

1. Design tokens, homepage components, onboarding polish and video feature.
2. Account schema, roles, ownership and invitations.
3. Student dashboard, advisor dashboard and admin assignment controls.
4. End-to-end security, mobile and desktop verification.
