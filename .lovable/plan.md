# Make the WhatsApp bot reliable end to end

## What the data shows (last 3 days)
- 74 WhatsApp updates arrived and every one was processed. Messages are reaching the site.
- 13 student messages got bot replies (9 delivered, 2 read). 2 replies failed: one because the AI returned nothing, one rejected by WhatsApp as "Invalid parameter".
- **The welcome message has never been sent.** 11 attempts failed with "Template does not exist in this language". The app always sends it in British English (en_GB), but the approved version on Meta uses a different language code. 18 students are stuck on "Waiting for Meta approval" because of this, and the bot never switches on for them.

## Fixes
1. **Welcome message:** read the template's real language and number of fields from Meta and send it with those, instead of guessing en_GB. Only send when the template is approved in that language.
2. **Catch up the 18 waiting students:** one admin button, "Send welcome to all waiting", that sends to every student who said yes to WhatsApp and has not opted out, one by one, skipping anyone already welcomed.
3. **Empty AI reply:** if the AI returns nothing, try once more after a short pause. If it is still empty, send a short natural fallback ("Thanks, give me a moment, an advisor will reply here shortly") and pass the chat to the advisor queue, so a student is never left without an answer.
4. **"Invalid parameter" rejection:** log what was sent (without personal data), then clean every reply before sending: trim to WhatsApp's length limit, remove empty or unsupported formatting, and never send a blank message. If WhatsApp still rejects it, hand the chat to an advisor instead of retrying forever.
5. **Unsupported files:** keep the friendly "please send PDF, JPEG or PNG" reply, and also accept HEIC photos from iPhones by asking the student to resend as a photo rather than a file.
6. **Admin health panel:** show "Welcome approved in: [language]", counts of replies sent, failed and waiting in the last 24 hours, and a list of failed replies with a "Retry" button.

## Testing
- Send the real welcome to a test lead and confirm it arrives and switches the bot on.
- Reply from that phone: normal question, "call me instead", sending a PDF, sending an unsupported file, a suspicious message, and STOP.
- Force an empty AI answer and an over-long reply to confirm the fallback and the clean-up work.
- Confirm no student gets two replies to one message.

## Needs you
- Publish, then Update after the changes, and send one message from your own phone so we can watch it live.

## Technical details
- `whatsapp.server.ts`: `getWelcomeTemplateStatus` returns `language` and body parameter count from `/message_templates`; `sendWelcome` uses that language code and slices parameters to match. Treat 132001 after that fix as `failed`, not `awaiting_template`.
- New admin-only server function `resendAllWaitingWelcomes` (has_role check), sequential sends with small delay, honours opt-outs and the `whatsapp` consent flag.
- In the reply worker: on `AI_NoOutputGeneratedError` or empty text, one retry, then fallback message plus `status: queued` with flag reason. Sanitise outbound text (max 4096 chars, non-empty, strip control chars). Code 100 is terminal: mark reply failed and queue for advisor.
- Admin: extend `WhatsAppHealth` with 24h reply stats and failed list using a retry server function that resets `reply_status` to `pending`.
