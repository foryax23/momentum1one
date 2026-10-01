# Make onboarding, WhatsApp and admin work end to end

## What is broken today (checked)
- The "Connect with us on WhatsApp" button and its 6-second countdown were written but never added to the success screen, so students don't see them.
- The phone step is still labelled "UK mobile" even though other countries can now be chosen.
- Meta is still reviewing the WhatsApp welcome message, so every welcome is turned down.
- No student WhatsApp messages have reached this project, so the bot has never replied.
- The admin account exists but its email isn't confirmed yet. Admin rights are already granted.
- Offer emails are not sent because no sender domain is set up.

## What I will build
1. **Success screen:** add the green "Connect with us on WhatsApp" button with the "Opening WhatsApp in 6s, Stay here" countdown, placed under the offer download.
2. **Phone step:** rename the label to "Mobile number", give each country its own example number, and remember the chosen country when the form is saved as a draft.
3. **WhatsApp until Meta approves:** when the welcome is turned down, mark the lead "waiting for approval" instead of "failed". Add a "Resend welcome" button in the admin lead view, so advisors can send it once Meta approves. When a student messages first (through the new button), the bot replies right away and doesn't need approval.
4. **Admin panel:** show the WhatsApp state clearly (waiting for approval, sent, failed with reason) and add a "Send test message" check so you can see if WhatsApp is reaching this project.
5. **Testing:** run the full form on phone and desktop sizes, including a non-UK number, and confirm the countdown opens WhatsApp. Test a reply to the bot through the real webhook once messages are routed to this project.

## Needs you (I can't do these)
- Click the confirmation email sent to mihaidandea13@gmail.com, then sign in at /auth.
- In Connectors, open WhatsApp, then Incoming messages, and choose this project. Then click Publish, then Update.
- Wait for Meta to approve the welcome message (up to 48 hours).
- Optional: set up a sender email domain so offers can also be emailed.

## Technical details
- funnel.tsx: render `WhatsAppRedirect` in the success block, add `cc` to the draft data, change the label and add a placeholder for each country.
- whatsapp.server.ts: map Meta error 132001 / 132015 to a new `whatsapp_status` value `awaiting_template`. This needs a migration to extend the status check.
- Add an admin-only server function (has_role check through requireSupabaseAuth) to re-run `sendWelcome` for a lead after resetting its status to pending.
- Add a "Send test message" check: read the webhook events count and the latest event time, and show it in the admin panel.
