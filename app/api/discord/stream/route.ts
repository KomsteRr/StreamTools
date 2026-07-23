import { discordMediaEmitter, DiscordMediaAlert } from "@/lib/discordMediaEmitter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const encoder = new TextEncoder();
  let isAlive = true;

  const stream = new ReadableStream({
    start(controller) {
      const onMediaAlert = (alert: DiscordMediaAlert) => {
        if (!isAlive) return;
        try {
          controller.enqueue(
            encoder.encode(`event: media-alert\ndata: ${JSON.stringify(alert)}\n\n`)
          );
        } catch {}
      };

      discordMediaEmitter.on("media-alert", onMediaAlert);

      // Heartbeat every 15s
      const heartbeat = setInterval(() => {
        if (!isAlive) {
          clearInterval(heartbeat);
          return;
        }
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          isAlive = false;
          clearInterval(heartbeat);
        }
      }, 15000);

      // Cleanup when client disconnects
      const cleanup = () => {
        isAlive = false;
        clearInterval(heartbeat);
        discordMediaEmitter.off("media-alert", onMediaAlert);
      };

      // Return cleanup for cancel
      controller.enqueue(encoder.encode(": connected\n\n"));

      return cleanup;
    },
    cancel() {
      isAlive = false;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
