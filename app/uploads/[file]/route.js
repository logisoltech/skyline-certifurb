import { promises as fs } from "node:fs";
import path from "node:path";

// Serves images uploaded through the CMS (stored in .data/uploads). Only
// names we generate ourselves are accepted, so path tricks can't escape the
// folder.
const NAME = /^[a-f0-9]{16}\.(png|jpg|webp)$/;
const TYPES = { png: "image/png", jpg: "image/jpeg", webp: "image/webp" };

export async function GET(_request, { params }) {
  const { file } = await params;
  if (!NAME.test(file)) return new Response("Not found", { status: 404 });

  try {
    const data = await fs.readFile(path.join(process.cwd(), ".data", "uploads", file));
    return new Response(data, {
      headers: {
        "Content-Type": TYPES[file.split(".")[1]],
        // Names are random and never reused, so they can be cached forever.
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
