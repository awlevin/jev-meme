import "server-only";
import { BlobNotFoundError, get, head, put } from "@vercel/blob";
import { cacheLife } from "next/cache";
import type { Meme } from "./formats";

const memePath = (id: string) => `memes/${id}.json`;

export const isMemeId = (id: string) => /^[A-Za-z0-9_-]{12}$/.test(id);

export async function loadMeme(id: string): Promise<Meme | null> {
  if (!isMemeId(id)) return null;
  try {
    return await fetchMeme(id);
  } catch {
    return null;
  }
}

// Memes never change once written. Throwing on a miss keeps misses out of the cache.
async function fetchMeme(id: string): Promise<Meme> {
  "use cache";
  cacheLife("max");
  // Skip the CDN: it can hold a 404 from before the meme existed.
  const res = await get(memePath(id), { access: "public", useCache: false });
  if (!res || res.statusCode !== 200) throw new Error(`No meme ${id}`);
  return (await new Response(res.stream).json()) as Meme;
}

export async function memeExists(id: string): Promise<boolean> {
  try {
    await head(memePath(id));
    return true;
  } catch (error) {
    if (error instanceof BlobNotFoundError) return false;
    throw error;
  }
}

export async function saveMeme(meme: Meme): Promise<void> {
  // Ids are content hashes, so an existing blob already holds this exact meme.
  await put(memePath(meme.id), JSON.stringify(meme), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

/** Store an uploaded photo under its content hash and return its public URL. */
export async function saveUpload(hash: string, bytes: Uint8Array, contentType: string): Promise<string> {
  const pathname = `uploads/${hash}.${contentType === "image/png" ? "png" : "jpg"}`;
  try {
    return (await head(pathname)).url;
  } catch (error) {
    if (!(error instanceof BlobNotFoundError)) throw error;
  }
  const blob = await put(pathname, Buffer.from(bytes), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType,
    cacheControlMaxAge: 31536000,
  });
  return blob.url;
}
