import { NextResponse } from "next/server";
import { getSession, getSafeUserId } from "@/lib/session";
import { regenerateOverlayToken } from "@/lib/overlay-token";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = getSafeUserId(session);
    const newToken = await regenerateOverlayToken(userId);

    return NextResponse.json({ ok: true, overlayToken: newToken });
  } catch (error) {
    console.error("Error regenerating overlay token:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
