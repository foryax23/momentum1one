# WhatsApp AI assistant with agent handover

## What students will experience
1. A student finishes onboarding. Within seconds they get a WhatsApp message from Momentum One. It uses their name, chosen course and campus, and gives the link to their offer.
2. If they reply, an AI assistant answers questions about courses, campuses, entry routes, documents, the pre-task and the PFF Day. It only uses the course details already on the site and in the offer, so it never makes up dates or contact details.
3. The assistant hands over to a human advisor when the student asks for one, is ready to apply, or asks something it cannot answer. It tells the student an advisor will reply soon and then stops replying in that chat.
4. Your advisors reply to the student from the WhatsApp Business app.

## What your team will see
- The admin panel gets a new "WhatsApp" section on each lead: first message sent or failed, conversation status (Bot chatting, Waiting for agent, With agent, Closed) and the chat history.
- A "Waiting for agent" queue sorted by who has waited longest, with each student's course and campus and a short AI summary of what they want.
- Buttons to "Mark as handled" or "Hand back to bot".

## Important WhatsApp rules
- WhatsApp requires an approved message template for the first message to someone who has not messaged you before. We will write a template ("Hi {name}, your {course} offer for {campus} is ready...") that you submit for approval in your WhatsApp Business account. Until it is approved, first messages cannot send. Leads are still saved as normal.
- The bot sends to every new student, as you asked. The consent text on the form already covers WhatsApp contact. The WhatsApp toggle will stay as a "preferred contact" signal only.
- Some numbers cannot run the automated bot and the WhatsApp Business phone app at the same time. If your number does not support that, advisors will need to reply from the admin panel or a second number. We will check this when we connect.

## Steps
1. Connect your WhatsApp Business account (a connect card will appear).
2. Store conversations and messages, and track each lead's queue status.
3. Send the welcome template right after a lead is saved. A send failure never blocks the lead or the offer download, and each student gets it only once.
4. Add a secure endpoint where WhatsApp delivers incoming student messages.
5. AI assistant replies with a handover tool that moves the chat into the agent queue.
6. Admin WhatsApp queue and lead chat history.
7. Test with a real number: first message, AI reply, handover, queue entry.

## Technical details
- WhatsApp connector via the connector gateway (`whatsapp`); credentials server-side only.
- New tables `whatsapp_conversations` (lead_id, wa_phone, status enum bot/queued/agent/closed, queued_at, summary, last_inbound_at) and `whatsapp_messages` (conversation_id, direction, body, wa_message_id unique, created_at). Grants to authenticated + service_role, RLS read for admins via `has_role`, writes only through server code with the admin client.
- `submitLead` calls a `sendWelcome` helper after insert, wrapped so failure is recorded (`whatsapp_status` on leads) rather than thrown. Idempotent on lead id.
- Webhook `src/routes/api/public/whatsapp/webhook.ts`: GET verify token handshake, POST verifies the Meta `X-Hub-Signature-256` with the app secret, dedupes on `wa_message_id`, matches the phone to a lead (normalised +44), stores the message, and runs the AI only when the status is `bot`.
- AI: `openai/gpt-6-astra` via Lovable AI Gateway Responses API, `streamText` server-side with full conversation history, system prompt built from `offer-catalog.ts` plus the lead's course/campus, and a `handover_to_agent({ reason, summary })` tool that sets status `queued`. Reply only inside the 24-hour session window.
- Messages from the business number sent outside the bot (agent replies in the app, if coexistence is supported) arrive as echo events and set status `agent` so the bot stays quiet.
- Secrets needed: webhook verify token (generated) and Meta app secret (requested from you).
