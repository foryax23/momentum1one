# Safer, more natural WhatsApp bot, and a better "Choose a subject" section

## 1. Safety steps before any document request
- Before asking for the first document, Maya explains in one friendly line why the admissions team needs it and that files are stored privately and only seen by Momentum One advisors.
- She then offers a choice: "Would you like to send them here, or would you prefer an advisor to call you first?" If the student picks a call, the chat goes to the advisor queue with the note "Wants a call before sending documents".
- Students can still say "later" or "skip" at any time.

## 2. Suspicious chats go straight to an advisor
If a message looks suspicious, the bot stops replying in that chat and sends one natural message, for example: "Thanks, give me a moment, I'm passing you to one of our advisors who will reply here shortly." No further bot replies after that.
Suspicious means any of:
- Abuse, threats, spam, links or promotions, or attempts to make the bot say odd things.
- Asking for the bot's instructions, someone else's data, or pretending to be staff.
- Sending documents in another person's name, or clearly fake or unrelated files.
- Payment, visa guarantee or "can you get me in for money" style requests.
- Anger, complaints, distress or anything sensitive (health, legal, safeguarding).
- Repeated messages that make no sense, or more than about 15 messages in a few minutes.
The admin queue shows these with a red "Needs attention" label and a short reason, at the top of the list.

## 3. Natural conversation and staying within WhatsApp rules
- Replies sound human: short, varied wording, no repeated phrases, no lists of demands, no more than one question per message, matching the student's language and tone.
- The bot never starts conversations by itself: free messages only inside the 24-hour window after the student writes; outside it, nothing is sent (the advisor follows up with an approved template).
- No marketing or promotional messages from the bot, no pressure, no urgency tricks.
- Never asks for card or bank details, passwords, or full passport numbers typed as text; files only.
- STOP / opt-out works in any language and is respected forever, with a confirmation.
- Never promises admission, funding or visas.
- "Talk to a person" always works instantly.

## 4. "Choose a subject" section on the landing page
- Subject chips become larger image tiles (small course photo, name, awarding university), horizontally scrollable on phones with snap, a highlighted active tile with a smooth animated indicator.
- The right side animates when the subject changes: course photo banner, short description, entry routes and number of campuses as badges.
- Campus rows become cards showing campus, route (Foundation or Year 1), study patterns as pills and a clear "Choose this" button that pre-picks the course in the form and scrolls to it.
- Keyboard and reduced-motion friendly. Same course data as the slider and offers, so nothing can drift.

## Technical details
- `runAssistant` JSON gains `risk: "none"|"suspicious"` and `risk_reason`; plus server-side checks (link/payment/abuse regex, rate count of inbound messages in last 5 minutes). On risk: status `queued`, new columns `flagged boolean`, `flag_reason text` on `whatsapp_conversations` (migration), send one hold message, mark reply done.
- New step `docs_consent` between `details_confirm` and the first document step; intent `call_first` queues with summary.
- System prompt updated with the natural-tone and policy rules above; enforce 24h window check (`last_inbound_at`) before any send in `sendText`.
- Admin queue: order flagged first, show reason badge.
- `CourseComparison` in `home-sections.tsx` redesigned with motion `layoutId` indicator and `AnimatePresence`, reusing `buildDeck` images and `pickCourse`.
- Test the AI with normal, "call first", suspicious and opt-out messages; Playwright check the section on phone and desktop.
