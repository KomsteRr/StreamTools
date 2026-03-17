import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// POST /api/invite/setup — validate invite token and set password
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, password } = body as { token: string; password: string };

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token et mot de passe requis." },
        { status: 400 }
      );
    }

    if (password.length < 12) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 12 caractères." },
        { status: 400 }
      );
    }

    // Find a valid, unused invite token
    const invite = await prisma.inviteToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Lien d'invitation invalide." },
        { status: 404 }
      );
    }

    if (invite.usedAt) {
      return NextResponse.json(
        { error: "Ce lien d'invitation a déjà été utilisé." },
        { status: 410 }
      );
    }

    if (new Date() > invite.expiresAt) {
      return NextResponse.json(
        { error: "Ce lien d'invitation a expiré." },
        { status: 410 }
      );
    }

    // Hash password and update user
    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: invite.userId },
        data: { passwordHash },
      }),
      prisma.inviteToken.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      username: invite.user.username,
    });
  } catch (error) {
    console.error("POST /api/invite/setup error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}
