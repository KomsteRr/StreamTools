import { chatEmitter, CombinedChatMessage } from "@/lib/chatEmitter";
import { initTwitchChatBot } from "@/lib/twitchChatBot";
import { isOverlayAuthorized } from "@/lib/overlay-token";
import { getSession, getSafeUserId } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await getSession();
  const overlayAuth = await isOverlayAuthorized(request);
  if (!session && !overlayAuth.authorized) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = getSafeUserId(session) ?? overlayAuth.userId ?? null;
  initTwitchChatBot(userId).catch(console.error);

  const encoder = new TextEncoder();
  let isAlive = true;

  const stream = new ReadableStream({
    start(controller) {
      const recentMessages = chatEmitter.getRecentMessages(userId);
      controller.enqueue(
        encoder.encode(`event: init\ndata: ${JSON.stringify(recentMessages)}\n\n`),
      );

      const unsubscribe = chatEmitter.subscribe(userId, (msg: CombinedChatMessage) => {
        if (!isAlive) return;
        try {
          controller.enqueue(
            encoder.encode(`event: message\ndata: ${JSON.stringify(msg)}\n\n`),
          );
        } catch {
          unsubscribe();
        }
      });

      const heartbeat = setInterval(() => {
        if (!isAlive) {
          clearInterval(heartbeat);
          return;
        }
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
          unsubscribe();
        }
      }, 15000);

      return () => {
        isAlive = false;
        clearInterval(heartbeat);
        unsubscribe();
      };
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
