import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { imageSize } from "image-size";
import { SAMPLE_IDS, samplePath } from "./samples";

const BLOB_HOST = /^[a-z0-9]+\.public\.blob\.vercel-storage\.com$/;

/** Bytes for a stored photo URL: a bundled sample path or one of our Blob uploads. */
export async function loadPhoto(url: string): Promise<Uint8Array> {
  const sample = /^\/samples\/([a-z-]+)\.jpg$/.exec(url);
  if (sample && SAMPLE_IDS.has(sample[1])) {
    return readFile(join(process.cwd(), "public", samplePath(sample[1])));
  }
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || !BLOB_HOST.test(parsed.hostname)) {
    throw new Error(`Refusing to load photo from ${parsed.hostname}`);
  }
  const res = await fetch(parsed, { cache: "force-cache" });
  if (!res.ok) throw new Error(`Photo fetch failed: ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

export function photoSize(bytes: Uint8Array): { width: number; height: number; type: string } {
  const { width, height, type } = imageSize(bytes);
  if (!width || !height || !type) throw new Error("Unreadable image");
  return { width, height, type };
}

export function toDataUrl(bytes: Uint8Array): string {
  const { type } = photoSize(bytes);
  const mime = type === "png" ? "image/png" : "image/jpeg";
  return `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;
}
