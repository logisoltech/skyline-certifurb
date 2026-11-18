"use server";

import crypto from "node:crypto";
import { authorize } from "../../lib/cms/auth";
import { createAdminClient } from "../../lib/supabase/admin";

const MAX_BYTES = 2 * 1024 * 1024;
const BUCKET = "product-images";

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
  const contentType = type === "jpg" ? "image/jpeg" : `image/${type}`;
  const admin = createAdminClient();
  const { error } = await admin.storage.from(BUCKET).upload(name, bytes, {
    contentType,
    upsert: false,
  });
  if (error) return { ok: false, error: error.message };

  const { data } = admin.storage.from(BUCKET).getPublicUrl(name);
  return { ok: true, path: data.publicUrl };
}
