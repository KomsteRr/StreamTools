import { wheelEmitter } from "@/lib/wheel-config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const encoder = new TextEncoder();
  let isAlive = true;

  const stream = new ReadableStream({
    start(controller) {
      const onSpin = (data: { winnerIndex: number; timestamp: number }) => {
        if (!isAlive) return;
        try {
          controller.enqueue(
            encoder.encode(`event: spin\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {}
      };

      wheelEmitter.on("spin", onSpin);

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
        wheelEmitter.off("spin", onSpin);
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
