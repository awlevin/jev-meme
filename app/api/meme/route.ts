import { createHash } from "node:crypto";
import { APIError } from "@typesafe-ai/sdk";
import { FORMATS, MAX_QUESTION_LENGTH, type FormatId, type Meme, type MemeImage } from "@/lib/formats";
import { judge, MODEL } from "@/lib/jev";
import { loadPhoto, photoSize } from "@/lib/photos";
import { SAMPLE_IDS, samplePath } from "@/lib/samples";
import { memeExists, saveMeme, saveUpload } from "@/lib/store";

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

const fail = (error: string, status = 400) => Response.json({ error }, { status });

const sha = (data: string | Uint8Array) => createHash("sha256").update(data).digest("base64url");

type Photo = { key: string; bytes: Uint8Array; width: number; height: number; upload?: string };

async function readPhoto(entry: FormDataEntryValue): Promise<Photo | string> {
  if (typeof entry === "string") {
    const id = entry.replace(/^sample:/, "");
    if (!entry.startsWith("sample:") || !SAMPLE_IDS.has(id)) return "Unknown sample.";
    const bytes = await loadPhoto(samplePath(id));
    return { key: entry, bytes, ...photoSize(bytes) };
  }
  if (entry.size > MAX_UPLOAD_BYTES) return "Pic too big.";
  const bytes = new Uint8Array(await entry.arrayBuffer());
  let size;
  try {
    size = photoSize(bytes);
  } catch {
    return "Can't read that pic.";
  }
  if (size.type !== "jpg" && size.type !== "png") return "Use a JPEG or PNG.";
  const { width, height } = size;
  if (Math.min(width, height) < 256 || width * height < 78_400) return "Pic too small.";
  if (Math.max(width, height) > 1568) return "Pic too big.";
  return { key: sha(bytes), bytes, width, height, upload: size.type === "png" ? "image/png" : "image/jpeg" };
}

export async function POST(request: Request) {
  const form = await request.formData();

  const format = FORMATS[String(form.get("format")) as FormatId];
  if (!format) return fail("Unknown format.");

  let questions: string[];
  try {
    questions = (JSON.parse(String(form.get("questions"))) as unknown[]).map((q) => String(q).trim()).filter(Boolean);
  } catch {
    return fail("Bad questions.");
  }
  if (!questions.length) return fail("Ask something.");
  if (questions.length > format.maxQuestions) return fail("Too many questions.");
  if (questions.some((q) => q.length > MAX_QUESTION_LENGTH)) return fail("Keep it shorter.");

  const entries = form.getAll("photo");
  if (entries.length < format.minImages || entries.length > format.maxImages) return fail("Wrong number of pics.");
  const photos: Photo[] = [];
  for (const entry of entries) {
    const photo = await readPhoto(entry);
    if (typeof photo === "string") return fail(photo);
    photos.push(photo);
  }

  const id = sha(JSON.stringify([format.id, questions, MODEL, photos.map((p) => p.key)])).slice(0, 12);
  if (await memeExists(id)) return Response.json({ id });

  let judgment;
  try {
    judgment = await judge(format.id, photos.map((p) => p.bytes), questions);
  } catch (error) {
    console.error("jev failed", error);
    if (error instanceof APIError && error.status === 400) return fail("Jev can't read that pic.");
    return fail("Jev is busy. Try again.", 502);
  }

  const images: MemeImage[] = await Promise.all(
    photos.map(async (p) => ({
      url: p.upload ? await saveUpload(p.key, p.bytes, p.upload) : samplePath(p.key.replace(/^sample:/, "")),
      width: p.width,
      height: p.height,
    })),
  );

  const meme: Meme = {
    v: 1,
    id,
    format: format.id,
    questions,
    images,
    scores: judgment.scores,
    box: judgment.box,
    model: judgment.model,
    createdAt: new Date().toISOString(),
  };
  await saveMeme(meme);
  return Response.json({ id });
}
