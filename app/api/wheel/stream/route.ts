import { wheelEmitter } from "@/lib/wheel-config";
import { getSession, getSafeUserId } from "@/lib/session";
import { isOverlayAuthorized } from "@/lib/overlay-token";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await getSession();
  const isAuth = await isOverlayAuthorized(request);

  if (!session && !isAuth.authorized) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = getSafeUserId(session) ?? isAuth.userId ?? null;

  const encoder = new TextEncoder();
  let isAlive = true;
  const stream = new ReadableStream({
    start(controller) {
      const unsubscribe = wheelEmitter.subscribe(userId, (data) => {
        if (!isAlive) return;
        try {
          controller.enqueue(encoder.encode(`event: spin\ndata: ${JSON.stringify(data)}\n\n`));
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

      controller.enqueue(encoder.encode(": connected\n\n"));
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
