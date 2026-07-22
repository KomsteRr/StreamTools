import { prisma } from "./prisma";
import crypto from "crypto";

export async function getOverlayToken(userId?: string | null): Promise<string> {
  const safeUserId = userId ?? null;

  const record = await prisma.platformConfig.findFirst({
    where: {
      platform: "system",
      key: "overlayToken",
      userId: safeUserId,
    },
  });

  if (record) {
    return record.value;
  }

  // Generate a new 32-char hex token
  const newToken = crypto.randomBytes(16).toString("hex");
  await prisma.platformConfig.create({
    data: {
      platform: "system",
      key: "overlayToken",
      value: newToken,
      userId: safeUserId,
    },
  });

  return newToken;
}

export async function isOverlayAuthorized(req?: Request | null, searchParamsToken?: string | null): Promise<{ authorized: boolean; userId?: string | null }> {
  let token = searchParamsToken;
  if (!token && req) {
    const url = new URL(req.url);
    token = url.searchParams.get("token");
  }

  if (!token) return { authorized: false };

  // Find which user this overlay token belongs to
  const record = await prisma.platformConfig.findFirst({
    where: {
      platform: "system",
      key: "overlayToken",
      value: token,
    },
  });

  if (!record) return { authorized: false };

  return { authorized: true, userId: record.userId };
}
