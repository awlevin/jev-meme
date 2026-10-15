import "server-only";
import { box, choice, image, noul, TypeSafeClient, type Image } from "@typesafe-ai/sdk";
import type { Box, FormatId, Mode } from "./formats";

// jev-preview is Jev 1.14, the only model that answers Box questions.
export const MODEL = "jev-preview";

let client: TypeSafeClient | undefined;

function jev(): TypeSafeClient {
  client ??= new TypeSafeClient({
    apiKey: process.env.TYPESAFE_AI_API_KEY,
    defaultHeaders: { "TypeSafe-Danger-Zone-Images": "true" },
  });
  return client;
}

export type Judgment = {
  model: string;
  scores: number[];
  box?: { edges: Box; confidence: number | null };
};

/** One Choice across every photo; returns P(photo i) in the given order. */
async function pickOnce(images: Image[], question: string) {
  const name = (i: number) => `photo_${i + 1}`;
  const res = await jev().systemOne({
    model: MODEL,
    state: Object.fromEntries(images.map((img, i) => [name(i), img])),
    questions: {
      q: choice(question, Object.fromEntries(images.map((_, i) => [name(i), `The one in \`${name(i)}\`.`]))),
    },
  });
  return { model: res.model, probs: images.map((_, i) => res.answers.q.probabilities[name(i)] ?? 0) };
}

/** Ask Jev about JPEG/PNG bytes; the shape of the answer depends on the format. */
export async function judge(
  format: FormatId,
  photos: Uint8Array[],
  questions: string[],
  mode: Mode = "each",
): Promise<Judgment> {
  const images = photos.map((bytes) => image(bytes));

  if (format === "spot") {
    const res = await jev().systemOne({
      model: MODEL,
      state: { photo: images[0] },
      questions: { target: box(`${questions[0]} in \`photo\``) },
    });
    const { box: edges, confidence } = res.answers.target;
    return { model: res.model, scores: [], box: { edges, confidence } };
  }

  if (format === "vibes") {
    const res = await jev().systemOne({
      model: MODEL,
      state: { photo: images[0] },
      questions: Object.fromEntries(questions.map((q, i) => [`q${i}`, noul(`About \`photo\`: ${q}`)])),
    });
    return { model: res.model, scores: questions.map((_, i) => res.answers[`q${i}`].noul) };
  }

  if (mode === "pick") {
    // Jev leans toward photos by position, so ask in both orders and average.
    const reversed = [...images].reverse();
    const [fwd, rev] = await Promise.all([pickOnce(images, questions[0]), pickOnce(reversed, questions[0])]);
    const n = images.length;
    return { model: fwd.model, scores: fwd.probs.map((p, i) => (p + rev.probs[n - 1 - i]) / 2) };
  }

  // versus/lineup "each": judge each photo on its own so one can't sway another.
  const results = await Promise.all(
    images.map((photo) =>
      jev().systemOne({
        model: MODEL,
        state: { photo },
        questions: { q: noul(`About \`photo\`: ${questions[0]}`) },
      }),
    ),
  );
  return { model: results[0].model, scores: results.map((r) => r.answers.q.noul) };
}
