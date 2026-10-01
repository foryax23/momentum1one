# WhatsApp bot: reply only to our students, and a friendlier admissions chat

## 1. Who the bot replies to
The bot will only reply when one of these is true:
- **The student got our welcome message** (sent after they finished the form on the website).
- **The student's message contains their reference code** (for example MO-2027-00120). This is what the "Connect with us on WhatsApp" button already pre-fills. The code must match a real application, and the phone number is then linked to it.

Everyone else (friends, suppliers, random contacts, old chats) gets **no automatic reply**. Their messages still show in the admin panel under a new "Not from website" label, so an advisor can reply from the WhatsApp Business app if they want.
- Chats already handed to an advisor stay silent, as today.
- Existing chats with no linked application are switched off for the bot.
- A student who types the code later (e.g. "my ref is MO-2027-00120") is recognised then, and the bot starts from that message.

## 2. A nicer, smoother admissions conversation
Today the bot pushes for documents in every reply. New flow:
1. **Warm welcome first:** greets by first name, confirms course and campus, explains in one line what happens next, and asks if they have a few minutes. Answers questions before asking for anything.
2. **Collect the information first, in conversation:** date of birth, full home address with postcode, nationality, current immigration status (UK citizen, settled/pre-settled, visa, other), highest qualification, and whether English is their first language. One question at a time, short and friendly, with a confirmation recap at the end ("Here is what I have, is it right?").
3. **Then documents, explained and only those needed:** a short list based on their answers (for example no share code request for UK citizens, no English evidence for native speakers). Each request says why it is needed and how to send it (photo or PDF).
4. **Flexible pacing:** "later", "I don't have it now" or "skip" is accepted kindly; the bot moves on and gently reminds about missing items at the end, not every message. At most one reminder per missing item.
5. **Answers questions anytime:** if the student asks about the course, campus, funding or the PFF Day mid-way, the bot answers first, then returns to where it left off.
6. **Tone:** replies in the student's language, short, human, encouraging, emoji-light, no lists of demands, thanks them after each item, shows progress ("3 of 6 done").
7. **Clear finish:** final recap, tells them an advisor will review and contact them, then hands over to the advisor queue.
STOP / opt-out and "talk to a person" keep working at any point.

## 3. Admin panel
- Each lead shows the collected details (date of birth, address, nationality, status, qualification, English) next to the document checklist, with items marked "not needed".
- New label for chats "Not from website" with no bot replies.

## Technical details
- Gate in `answerInbound`/`processEvent`: bot replies only if the conversation is `bot_enabled`. It becomes enabled when `sendWelcome` succeeds for the lead, or when an inbound body matches `/MO-\d{4}-\d{5}/i` resolving to an existing lead (link `lead_id`, enable, store `activated_via`: welcome | ref_code). Remove automatic phone-number matching as an activation path (keep it only for display linking). Unlinked inbound messages are stored with `reply_status: "skipped"`.
- Migration: `whatsapp_conversations` add `bot_enabled boolean default false`, `activated_via text`, `profile jsonb default '{}'` (collected answers), `reminders jsonb`; backfill `bot_enabled = true` only for conversations whose lead has `whatsapp_status = 'sent'`.
- New steps before documents: `welcome`, `details` (sub-fields tracked in `profile`), `details_confirm`, then documents; `not_needed` computed from profile (immigration skipped for UK citizens, English skipped for native/UK-qualified).
- AI (`openai/gpt-6-astra`, Responses API) returns a small structured result: reply text, detected language, extracted profile fields, intent (question / answer / skip / later / advisor). Server code decides the step, so the AI cannot jump ahead or repeat demands.
- Admin: show `profile` and "not needed" items in the lead detail; add the "Not from website" filter.
- Test: unknown number gets no reply; message with valid code gets reply and linking; invalid code gets no reply; full conversation through details, skips and documents to advisor handover.
