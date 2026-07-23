import { discordMediaEmitter, DiscordMediaAlert } from "@/lib/discordMediaEmitter";
import { parseSession } from "@/lib/session";
import { cookies } from "next/headers";
import { isOverlayAuthorized } from "@/lib/overlay-token";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function getUserId(req: Request): Promise<string | null | undefined> {
  const auth = await isOverlayAuthorized(req);
  if (auth.authorized) {
    return auth.userId ?? null;
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;
  if (sessionCookie) {
    const session = await parseSession(sessionCookie);
    if (session?.userId) {
      return session.userId;
    }
  }

  return undefined;
}

export async function GET(req: Request) {
  const userId = await getUserId(req);
  if (userId === undefined) return new Response("Unauthorized", { status: 401 });

  const encoder = new TextEncoder();
  let isAlive = true;

  const stream = new ReadableStream({
    start(controller) {
      const unsubMedia = discordMediaEmitter.subscribe(userId, (alert: DiscordMediaAlert) => {
        if (!isAlive) return;
        try {
          controller.enqueue(
            encoder.encode(`event: media-alert\ndata: ${JSON.stringify(alert)}\n\n`),
          );
        } catch {
          cleanup();
        }
      });

      const unsubQueue = discordMediaEmitter.subscribeQueue(userId, (queue: DiscordMediaAlert[]) => {
        if (!isAlive) return;
        try {
          controller.enqueue(
            encoder.encode(`event: queue-update\ndata: ${JSON.stringify(queue)}\n\n`),
          );
        } catch {
          cleanup();
        }
      });

      const unsubDelete = discordMediaEmitter.subscribeDelete(userId, (alertId: string) => {
        if (!isAlive) return;
        try {
          controller.enqueue(
            encoder.encode(`event: media-delete\ndata: ${JSON.stringify({ id: alertId })}\n\n`),
          );
        } catch {
          cleanup();
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
          cleanup();
        }
      }, 15000);

      const cleanup = () => {
        isAlive = false;
        clearInterval(heartbeat);
        unsubMedia();
        unsubQueue();
        unsubDelete();
      };

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
