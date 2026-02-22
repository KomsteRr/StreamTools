import { subscribeToAlerts } from "@/lib/alertEmitter";
import { isOverlayAuthorized } from "@/lib/overlay-token";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const session = cookieStore.get("session");
  const isOverlayAuth = await isOverlayAuthorized(request);

  if (!session && !isOverlayAuth) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial ping to confirm connection
      controller.enqueue(encoder.encode("data: {\"type\":\"connected\"}\n\n"));

      const unsubscribe = subscribeToAlerts((data) => {
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch {
          // Client disconnected
          unsubscribe();
        }
      });

      // Heartbeat every 25 seconds to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
          unsubscribe();
        }
      }, 25000);

      // Clean up on stream cancel
      return () => {
        clearInterval(heartbeat);
        unsubscribe();
      };
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
