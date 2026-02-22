import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "alerts");

function detectMediaType(filename: string): "image" | "gif" | "video" | "audio" {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".gif") return "gif";
  if ([".mp4", ".webm", ".ogg", ".mov"].includes(ext)) return "video";
  if ([".mp3", ".wav", ".ogg", ".aac"].includes(ext)) return "audio";
  return "image";
}

export async function POST(req: Request) {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const filePath = path.join(UPLOAD_DIR, safeName);

    await writeFile(filePath, buffer);

    const url = `/uploads/alerts/${safeName}`;
    const mediaType = detectMediaType(file.name);

    return NextResponse.json({ url, mediaType });
  } catch (error) {
    console.error("POST /api/alerts/upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
