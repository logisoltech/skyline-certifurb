"use server";

import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { authorize } from "../../lib/cms/auth";

// ("use server" files may only export async functions, so this stays private.)
const UPLOAD_DIR = path.join(process.cwd(), ".data", "uploads");
const MAX_BYTES = 2 * 1024 * 1024;

// Decide the type from the file's own first bytes, never from the
// client-supplied name or MIME type.
function sniff(bytes) {
  if (bytes.length > 12) {
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
    const riff = String.fromCharCode(...bytes.slice(0, 4));
    const webp = String.fromCharCode(...bytes.slice(8, 12));
    if (riff === "RIFF" && webp === "WEBP") return "webp";
  }
  return null;
}

export async function uploadImageAction(formData) {
  const auth = await authorize("products:write");
  if (!auth.ok) return auth;

  const file = formData.get("file");
  if (!file || typeof file === "string" || file.size === 0) {
    return { ok: false, error: "Choose an image to upload." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Image is too large. Keep it under 2 MB." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniff(bytes);
  if (!type) return { ok: false, error: "Only PNG, JPG or WebP images are allowed." };

  const name = `${crypto.randomBytes(8).toString("hex")}.${type}`;
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, name), bytes);
  return { ok: true, path: `/uploads/${name}` };
}
