import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/whatsapp/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { verifyWebhookRequest } = await import("@lovable.dev/webhooks-js");
        const secret = process.env.WHATSAPP_API_KEY;
        if (!secret) return new Response("Not configured", { status: 500 });
        let payload: unknown;
        try {
          ({ payload } = await verifyWebhookRequest({ req: request, secret, maxBodyBytes: 4 * 1024 * 1024 }));
        } catch {
          return new Response("Unauthorized", { status: 401 });
        }
        const deliveryId = request.headers.get("X-Lovable-Delivery");
        const event = request.headers.get("X-Lovable-Event");
        if (!deliveryId || !event) return new Response("Missing headers", { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const wa = await import("@/lib/whatsapp.server");
        const { error } = await supabaseAdmin.from("whatsapp_webhook_events")
          .upsert({ delivery_id: deliveryId, event, payload: payload as never }, { onConflict: "delivery_id", ignoreDuplicates: true });
        if (error) { console.error(error); return new Response("Store failed", { status: 500 }); }
        const { data: row } = await supabaseAdmin.from("whatsapp_webhook_events").select("id, processed_at").eq("delivery_id", deliveryId).single();
        if (!row) return new Response("Store failed", { status: 500 });

        let toAnswer: string[] = [];
        if (!row.processed_at) {
          try { toAnswer = await wa.processEvent(row.id); }
          catch (e) { console.error("WhatsApp processing failed", e); return new Response("Processing failed", { status: 500 }); }
        }
        // Inbound messages are stored with a pending reply, so a timeout here is recovered on a later call.
        try { toAnswer.push(...(await wa.recoverPending())); } catch (e) { console.error(e); }
        for (const id of toAnswer) await wa.answerInbound(id);
        return new Response("ok");
      },
    },
  },
});
