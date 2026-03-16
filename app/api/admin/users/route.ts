import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import crypto from "crypto";

// GET /api/admin/users — list all users
export async function GET() {
  const session = await requireSession(true);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      role: true,
      passwordHash: false,
      createdAt: true,
      inviteTokens: {
        select: {
          token: true,
          usedAt: true,
          expiresAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  // Add a status field: "active" if password set, "pending" if not
  const enriched = users.map((u) => ({
    ...u,
    status: u.inviteTokens[0]?.usedAt ? "active" : "pending",
    inviteToken: u.inviteTokens[0] ?? null,
  }));

  return NextResponse.json(enriched);
}

// POST /api/admin/users — create a user + invite token
export async function POST(req: Request) {
  const session = await requireSession(true);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const username = (body.username as string)?.trim()?.toLowerCase();

  if (!username || username === "admin") {
    return NextResponse.json(
      { error: "Nom d'utilisateur invalide." },
      { status: 400 }
    );
  }

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json(
      { error: "Cet utilisateur existe déjà." },
      { status: 409 }
    );
  }

  // Create user + invite token in a transaction
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const user = await prisma.user.create({
    data: {
      username,
      role: "user",
      inviteTokens: {
        create: {
          token,
          expiresAt,
        },
      },
    },
    include: {
      inviteTokens: true,
    },
  });

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
    },
    inviteToken: token,
  });
}
