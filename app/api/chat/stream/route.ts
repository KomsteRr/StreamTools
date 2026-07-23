import { chatEmitter, CombinedChatMessage } from "@/lib/chatEmitter";
import { initTwitchChatBot } from "@/lib/twitchChatBot";
import { isOverlayAuthorized } from "@/lib/overlay-token";
import { getSession, getSafeUserId } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    const isAuth = await isOverlayAuthorized(request);
    const userId = getSafeUserId(session) ?? isAuth.userId ?? null;

    // Automatically trigger Twitch IRC bot connection for the target user's channel
    initTwitchChatBot(userId).catch(console.error);
  } catch (e) {}

  const encoder = new TextEncoder();
  let isAlive = true;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial messages buffer
      const recentMessages = chatEmitter.getRecentMessages();
      try {
        controller.enqueue(
          encoder.encode(`event: init\ndata: ${JSON.stringify(recentMessages)}\n\n`)
        );
      } catch {}

      const onMessage = (msg: CombinedChatMessage) => {
        if (!isAlive) return;
        try {
          controller.enqueue(
            encoder.encode(`event: message\ndata: ${JSON.stringify(msg)}\n\n`)
          );
        } catch {}
      };

      chatEmitter.on("message", onMessage);

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

      const cleanup = () => {
        isAlive = false;
        clearInterval(heartbeat);
        chatEmitter.off("message", onMessage);
      };

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
