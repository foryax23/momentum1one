<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Leads are inserted only via the `submitLead` server function (admin client, zod-validated); RLS grants anon no access to `leads`.
- Admin access is checked via `user_roles` + `has_role()`; the first account to sign up is auto-granted admin by a DB trigger.
- The offer PDF is rendered client-side with @react-pdf/renderer, dynamically imported so it stays out of SSR.
- Campus course choices, offer content, and study patterns use one typed catalogue so student, admin, and PDF views stay consistent.
- Public offer links use expiring random tokens stored only as SHA-256 hashes so lead data is not enumerable.
- WhatsApp: inbound webhook stores every delivery in whatsapp_webhook_events before processing; bot replies are claimed per inbound message (reply_status) so retries never double-send.
- WhatsApp webhook work continues through the request runtime's waitUntil hook, while database-backed pending states provide retry recovery.
- Admission files are downloaded server-side immediately from WhatsApp into the private admissions-documents bucket; browser access is limited to short-lived admin URLs.
- The PDF renderer is loaded only via loadOfferPdf(), gated on import.meta.env.SSR, because bundling it into the server worker crashed every page.
- The homepage hero video is a silent, reduced-motion-aware CDN asset; factual text and application controls stay as semantic foreground content.
