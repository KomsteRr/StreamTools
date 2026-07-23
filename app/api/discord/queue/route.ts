import { NextResponse } from "next/server";
import { parseSession } from "@/lib/session";
import { cookies } from "next/headers";
import { isOverlayAuthorized } from "@/lib/overlay-token";
import { discordMediaEmitter } from "@/lib/discordMediaEmitter";

export const dynamic = "force-dynamic";

async function getUserId(req: Request): Promise<string | null | undefined> {
  // 1. Check Token Authorization
  const auth = await isOverlayAuthorized(req);
  if (auth.authorized) {
    return auth.userId ?? null;
  }

  // 2. Check Session
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
  try {
    const userId = await getUserId(req);
    if (userId === undefined) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const queue = discordMediaEmitter.getQueue(userId);
    return NextResponse.json({ queue });
  } catch (error) {
    console.error("Error in GET /api/discord/queue:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const userId = await getUserId(req);
    if (userId === undefined) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const clear = searchParams.get("clear") === "true";

    if (clear) {
      discordMediaEmitter.clearQueue(userId);
      return NextResponse.json({ ok: true, queue: [] });
    }

    if (id) {
      const deleted = discordMediaEmitter.deleteAlert(userId, id);
      const queue = discordMediaEmitter.getQueue(userId);
      return NextResponse.json({ ok: true, deleted, queue });
    }

    return NextResponse.json({ error: "Paramètre 'id' ou 'clear' requis" }, { status: 400 });
  } catch (error) {
    console.error("Error in DELETE /api/discord/queue:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getUserId(req);
    if (userId === undefined) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, id } = body || {};

    if (action === "clear") {
      discordMediaEmitter.clearQueue(userId);
      return NextResponse.json({ ok: true, queue: [] });
    }

    if (action === "delete" && id) {
      const deleted = discordMediaEmitter.deleteAlert(userId, id);
      const queue = discordMediaEmitter.getQueue(userId);
      return NextResponse.json({ ok: true, deleted, queue });
    }

    return NextResponse.json({ error: "Action non valide" }, { status: 400 });
  } catch (error) {
    console.error("Error in POST /api/discord/queue:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
