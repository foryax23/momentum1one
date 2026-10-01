# Personalised student offers and email delivery

## Goal
Turn the four uploaded campus packs into the offer students receive after onboarding. Each student gets a five-page offer personalised with their name, selected course, matched campus, intake, issue date and reference number. The same offer is available immediately after signup and through a secure email link.

## Onboarding changes
- Add a course-choice step after the nearest-campus match.
- Show only courses and entry routes available at that campus, including the Year 1 options for Manchester and Derby.
- Keep the existing name, city, phone, WhatsApp, email and consent questions.
- Save the chosen course and route with the lead so the admin view and offer always agree.
- For Luton, offer Public Health and generate a dedicated Luton pack in the same visual system. Any timetable or intake detail not already confirmed will be labelled “To be confirmed”, not invented.

## Personalised five-page offer
Rebuild the uploaded design as a reusable PDF template, preserving its structure and campus-specific content:

1. **Student offer cover**
   - Student name, selected course, matched campus, intake, issue date and reference.
   - Campus-specific course, university and class summary.
2. **Selected course and timetable**
   - Lead with the chosen course and its actual study-pattern options from the relevant uploaded pack.
   - Keep the campus’s other available choices as secondary alternatives.
3. **How to apply**
   - Eligibility guidance, five-step enrolment journey and campus-specific PFF information.
4. **Get ready**
   - Document checklist and pre-task requirements.
5. **PFF Day**
   - Schedule, assessment criteria, golden rules and final Momentum One call to action.

Use the Manchester, Derby, Newcastle and Sunderland uploads as the source of truth for campus differences. Create Luton in the same exact design language using confirmed Public Health information. Keep the uploaded disclaimer and do not present this document as a confirmed university admission offer.

Replace the current one-page pathway certificate with this offer. Keep the transparent Momentum One logo, Robert’s signature area, and the new navy, teal, sky and flame brand styling. Do not insert fake phone, email or social details where the uploaded PDFs contain placeholders.

## Download experience
- After successful onboarding, show the selected course and campus before the download action.
- Generate and download the personalised five-page PDF immediately.
- Use a filename containing the student reference, campus and course.
- Add a dedicated secure offer page so the student can return from the email and download the same personalised document.
- Make offer links unguessable and time-limited, and expose only the fields required to render that student’s offer.

## Offer email
- Create a branded Momentum One confirmation email sent only to the student who completed onboarding.
- Include their name, course, campus, reference and next steps.
- Add a prominent secure “Download your personalised offer” button. The email service does not support file attachments, so the secure link is the supported delivery method.
- Send once per completed lead, with duplicate-send protection. A delivery failure must not lose the lead or prevent the on-screen download.
- Sending begins once the Momentum One sender domain is configured and verified. Until then, onboarding and website download continue to work normally.

## Admin updates
- Add course, entry route and offer status to the lead list and detail view.
- Let administrators open the same personalised offer from a lead record.
- Show whether the offer email was sent, suppressed or could not be sent, without exposing the secure link itself.

## Technical details
- Extend the existing lead record with selected course, study route, secure offer access and email outcome fields. Keep lead creation inside the existing validated server function and preserve the current locked-down access rules.
- Store campus/course/timetable content in one typed offer catalogue so the onboarding choices, PDF, email and admin view cannot drift apart.
- Create the offer PDF with the existing dynamically loaded PDF renderer, expanded to five A4 pages.
- Add a token-protected offer page that retrieves only safe offer data and renders the same PDF used immediately after signup.
- Use Lovable’s managed app email service after sender-domain setup. No email queue, email tables or attachment system will be added.

## Verification
- Compare all five generated pages against each uploaded reference for Manchester, Derby, Newcastle and Sunderland.
- Generate and visually inspect a Luton version and at least one personalised offer for every campus.
- Inspect every rendered PDF page for clipping, overlaps, missing glyphs, incorrect schedules and low contrast, then correct and rerender any issue found.
- Test the full phone and desktop path: city match, course selection, lead submission, immediate PDF download, secure email link and repeat download.
- Confirm invalid or expired offer links reveal no student details.
- Confirm lead creation still succeeds if email is pending, suppressed or unavailable.
- Confirm the admin list and detail view show the selected course and offer state correctly.
