import { prisma } from "./prisma";
import crypto from "crypto";

export async function getOverlayToken(): Promise<string> {
  const record = await prisma.platformConfig.findUnique({
    where: { platform_key: { platform: "system", key: "overlayToken" } },
  });

  if (record) {
    return record.value;
  }

  // Generate a new 32-char hex token
  const newToken = crypto.randomBytes(16).toString("hex");
  await prisma.platformConfig.create({
    data: { platform: "system", key: "overlayToken", value: newToken },
  });

  return newToken;
}

export async function isOverlayAuthorized(req?: Request | null, searchParamsToken?: string | null): Promise<boolean> {
  let token = searchParamsToken;
  if (!token && req) {
    const url = new URL(req.url);
    token = url.searchParams.get("token");
  }

  if (!token) return false;

  const validToken = await getOverlayToken();
  return token === validToken;
}
