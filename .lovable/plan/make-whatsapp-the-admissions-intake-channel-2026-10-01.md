# Make WhatsApp the admissions intake channel

## Confirmed diagnosis

- Incoming WhatsApp is connected correctly. The app has received and stored real student messages and phone-app replies.
- Meta currently reports `momentum_offer_welcome` as **PENDING**, not approved. Existing welcome attempts fail because that template is not yet available in `en_GB`.
- The bot starts generating replies, but the WhatsApp delivery request ends before the AI finishes. Recent AI calls were cancelled after roughly 3 to 5 seconds, leaving one message stuck as “sending”.
- Photos and PDFs are currently recorded only as labels such as `[document message]`. The actual files are not downloaded or retained.

## 1. Repair reliable bot replies

- Separate webhook receipt from AI reply generation so incoming messages are acknowledged immediately and never cancelled while the bot is thinking.
- Store every reply job durably, claim it once, and process pending jobs through a short internal worker with bounded retries.
- Recover messages already stuck in `sending`, while preventing duplicate replies.
- Keep the bot silent when a conversation belongs to an advisor, and return it to bot mode only through the existing admin action.
- Add clear admin states: waiting, generating, sent, failed, needs advisor, and outside WhatsApp’s reply window.

## 2. Make the approved-template state accurate

- Read the live template name, language, component count, and status instead of assuming approval.
- While Meta still reports `PENDING`, display “Waiting for Meta review” and do not classify the connection as broken.
- Once Meta reports `APPROVED`, automatically allow welcome sends and provide one admin action to resend welcomes to eligible leads that previously waited.
- Preserve delivery receipts so “accepted”, “delivered”, “read”, and “failed” remain distinct.

## 3. Guided admissions conversation

The assistant will auto-detect the student’s language, reply in that language, and guide them through one item at a time:

1. Confirm full legal name and chosen course/campus
2. Passport or national identity document
3. Proof of address dated within the accepted period
4. Immigration status or share code when relevant
5. Previous qualifications and certificates
6. English-language evidence when required
7. CV
8. Review the checklist and hand the completed case to an advisor

- Use short WhatsApp prompts and confirmations rather than one long checklist.
- Never decide whether a document is genuine, sufficient, or whether the student is eligible.
- Clearly say that an advisor reviews all files and confirms next steps.
- Support “STOP” and equivalent opt-out wording without losing the application record.

## 4. Secure document collection

- Add a private admissions-document area with administrator-only access.
- For incoming WhatsApp images and documents, retain the media ID, safely download the file immediately, enforce type and size limits while streaming, and store it under the matching student application.
- Accept PDF, JPEG, and PNG for the initial version. Reject unsupported or oversized files with a helpful reply.
- Store the original filename, file type, size, upload time, source message, requested checklist item, and collection status.
- Do not analyse, extract, validate, or score document contents. This version collects and organises files only, as requested.
- Keep failed downloads pending for recovery because WhatsApp download links expire quickly.

## 5. Admissions workspace for admins

- Add an admissions checklist to every lead with received, missing, replaced, and needs-review states.
- Show secure document previews/downloads only to signed-in admins.
- Add a “Ready for advisor review” queue sorted by completion time and waiting time.
- Let an advisor mark individual files reviewed, request a replacement with a reason, and mark the pack complete.
- Show the detected student language, latest bot step, conversation status, delivery health, and any failed file transfer in one place.
- Keep the existing WhatsApp agent queue, offer download, and lead details together rather than creating a disconnected second admin system.

## 6. Recovery, privacy, and end-to-end checks

- Add fair recovery for unfinished webhook events, stuck replies, and incomplete media downloads so one bad item cannot block newer students.
- Keep webhook signature verification, message deduplication, admin role checks, and private-file rules in place.
- Record consent and opt-out status, minimise exposed personal data, and avoid placing file links in chat history or public URLs.
- Test with one real student flow: welcome status, incoming text, multilingual reply, PDF upload, image upload, checklist progress, advisor handover, replacement request, opt-out, delivery receipts, and mobile admin use.
- Recheck Meta’s template status during verification. If it remains pending, text and document replies from students will still work, while business-initiated welcomes remain visibly paused.

## Technical details

- Extend the current WhatsApp message and conversation records instead of replacing them.
- Add an admissions checklist/document record linked to the existing lead and WhatsApp message, with explicit authenticated-admin and server-only permissions.
- Use a private Cloud storage bucket with administrator-only file access.
- Keep WhatsApp media retrieval and AI calls server-side. No secret, temporary media URL, or private file URL reaches browser code.
- Keep `openai/gpt-6-astra` on the Responses API with the existing server-held Lovable AI access, but move generation outside the time-sensitive webhook response path.
