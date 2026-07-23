import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "alerts");
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_MEDIA: Record<string, { extension: string; mediaType: "image" | "gif" | "video" | "audio" }> = {
  "image/jpeg": { extension: "jpg", mediaType: "image" },
  "image/png": { extension: "png", mediaType: "image" },
  "image/webp": { extension: "webp", mediaType: "image" },
  "image/gif": { extension: "gif", mediaType: "gif" },
  "video/mp4": { extension: "mp4", mediaType: "video" },
  "video/webm": { extension: "webm", mediaType: "video" },
  "audio/mpeg": { extension: "mp3", mediaType: "audio" },
  "audio/wav": { extension: "wav", mediaType: "audio" },
  "audio/aac": { extension: "aac", mediaType: "audio" },
  "audio/ogg": { extension: "ogg", mediaType: "audio" },
};

export async function POST(req: Request) {
  if (!(await requireSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const media = ALLOWED_MEDIA[file.type];
    if (!media) {
      return NextResponse.json({ error: "Unsupported media type" }, { status: 415 });
    }
    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File must be between 1 byte and 10 MB" }, { status: 413 });
    }

    await mkdir(UPLOAD_DIR, { recursive: true });
    const safeName = `${randomUUID()}.${media.extension}`;
    await writeFile(path.join(UPLOAD_DIR, safeName), Buffer.from(await file.arrayBuffer()));

    return NextResponse.json({
      url: `/uploads/alerts/${safeName}`,
      mediaType: media.mediaType,
    });
  } catch (error) {
    console.error("POST /api/alerts/upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
