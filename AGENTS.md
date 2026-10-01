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
