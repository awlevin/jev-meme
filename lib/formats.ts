// Meme formats, shared by the client composer, the API, and the renderer.

export type FormatId = "versus" | "lineup" | "vibes" | "spot";

export type Format = {
  id: FormatId;
  name: string;
  minImages: number;
  maxImages: number;
  /** How many prompts the user writes. */
  maxQuestions: number;
  placeholder: string;
};

export const FORMATS: Record<FormatId, Format> = {
  versus: {
    id: "versus",
    name: "Two pics",
    minImages: 2,
    maxImages: 2,
    maxQuestions: 1,
    placeholder: "Does he enjoy his beverage?",
  },
  lineup: {
    id: "lineup",
    name: "Lineup",
    minImages: 3,
    maxImages: 4,
    maxQuestions: 1,
    placeholder: "Which would win in a fight?",
  },
  vibes: {
    id: "vibes",
    name: "Many Qs",
    minImages: 1,
    maxImages: 1,
    maxQuestions: 4,
    placeholder: "Is he guilty?",
  },
  spot: {
    id: "spot",
    name: "Find it",
    minImages: 1,
    maxImages: 1,
    maxQuestions: 1,
    placeholder: "the cat",
  },
};

export const FORMAT_IDS = Object.keys(FORMATS) as FormatId[];

export const MAX_QUESTION_LENGTH = 120;

/** Multi-photo memes either rate each photo alone or make Jev pick between them. */
export type Mode = "each" | "pick";

export const hasModes = (format: FormatId) => format === "versus" || format === "lineup";

/** "Who loves their beverage more?" reads as a pick; "Is this cake?" reads as rate-each. */
export function defaultMode(question: string): Mode {
  const q = question.trim().toLowerCase();
  if (/^(who|which|whose)\b/.test(q)) return "pick";
  if (/\b(more|less|better|worse|best|worst|most|least)\b|\w+er than\b/.test(q)) return "pick";
  return "each";
}

export type MemeImage = { url: string; width: number; height: number };

export type Box = { top: number; bottom: number; left: number; right: number };

/** A finished meme, as stored in Blob at memes/{id}.json. */
export type Meme = {
  v: 1;
  id: string;
  format: FormatId;
  questions: string[];
  images: MemeImage[];
  /** versus/lineup only; absent means "each". */
  mode?: Mode;
  /** versus/lineup: one score per image ("pick" scores sum to 1). vibes: one score per question. */
  scores: number[];
  /** spot only. */
  box?: { edges: Box; confidence: number | null };
  model: string;
  createdAt: string;
};

/** "0.03"-style label used everywhere a score is shown. */
export function formatScore(p: number): string {
  return Math.min(1, Math.max(0, p)).toFixed(2);
}

/** Title used for pages, alt text, and share text. */
export function memeTitle(meme: Pick<Meme, "format" | "questions">): string {
  if (meme.format === "spot") return `Where's ${meme.questions[0]}?`;
  return meme.questions.join(" ");
}
