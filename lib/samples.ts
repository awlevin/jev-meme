import type { FormatId, Mode } from "./formats";

// Bundled photos (public/samples). Most come from scripts/gen-samples.mts; the
// beverage pair is cropped from the original meme that inspired this app.
export const SAMPLE_PHOTOS = [
  { id: "stout-sip", alt: "Man sipping a stout" },
  { id: "can-chug", alt: "Man chugging a can" },
  { id: "dog-ball", alt: "Dog with a ball" },
  { id: "raccoon-trash", alt: "Raccoon in a trash can" },
  { id: "hotdog", alt: "Hot dog" },
  { id: "taco", alt: "Taco" },
  { id: "shoe-cake", alt: "Sneaker cake" },
  { id: "sneaker", alt: "Sneaker" },
  { id: "cat-keyboard", alt: "Cat asleep on a laptop" },
  { id: "dog-tie", alt: "Dog in a tie" },
  { id: "ladder", alt: "Man on a ladder with a chainsaw" },
  { id: "harness", alt: "Worker in a harness" },
  { id: "goose", alt: "Angry goose" },
  { id: "duckling", alt: "Duckling" },
  { id: "sloth", alt: "Sloth" },
  { id: "messy-room", alt: "Messy living room" },
] as const;

export type SampleId = (typeof SAMPLE_PHOTOS)[number]["id"];

export const SAMPLE_IDS = new Set<string>(SAMPLE_PHOTOS.map((p) => p.id));

export const samplePath = (id: string) => `/samples/${id}.jpg`;

export type Preset = {
  format: FormatId;
  photos: SampleId[];
  questions: string[];
};

// One-tap examples shown first on the home page.
export const PRESETS: Preset[] = [
  { format: "versus", photos: ["raccoon-trash", "dog-ball"], questions: ["Is this a good boy?"] },
  { format: "versus", photos: ["hotdog", "taco"], questions: ["Which one is more of a sandwich?"] },
  { format: "versus", photos: ["stout-sip", "can-chug"], questions: ["Who loves their beverage more?"] },
  { format: "versus", photos: ["ladder", "harness"], questions: ["Is this OSHA compliant?"] },
  { format: "versus", photos: ["sneaker", "shoe-cake"], questions: ["Is this cake?"] },
  { format: "versus", photos: ["cat-keyboard", "dog-tie"], questions: ["Ready for Monday?"] },
  {
    format: "lineup",
    photos: ["goose", "duckling", "sloth", "raccoon-trash"],
    questions: ["Which would win in a fight?"],
  },
  {
    format: "vibes",
    photos: ["raccoon-trash"],
    questions: ["Is he guilty?", "Is he sorry?", "Will he do it again?"],
  },
  { format: "spot", photos: ["messy-room"], questions: ["the cat"] },
];

// Idea prompts as [Rate each, Pick one] pairs, so switching modes can rewrite
// the question. Each side must read as its own mode to defaultMode().
export const QUESTION_PAIRS: [each: string, pick: string][] = [
  ["Is this a good boy?", "Who is the better boy?"],
  ["Is this a sandwich?", "Which one is more of a sandwich?"],
  ["Does he enjoy his beverage?", "Who loves their beverage more?"],
  ["Is this OSHA compliant?", "Which one is more OSHA compliant?"],
  ["Is this cake?", "Which one is cake?"],
  ["Ready for Monday?", "Who is more ready for Monday?"],
  ["Would this win a fight?", "Which would win in a fight?"],
  ["Does this have aura?", "Who has more aura?"],
  ["Would they text back?", "Who is more likely to text back?"],
  ["Is this person having a bad day?", "Who is having a worse day?"],
  ["Is this cursed?", "Which one is more cursed?"],
  ["Would this survive a zombie apocalypse?", "Who would survive a zombie apocalypse?"],
  ["Is this main character energy?", "Who is the main character?"],
  ["Would you trust them with your dog?", "Who would you trust with your dog?"],
  ["Did they peak in high school?", "Who peaked in high school?"],
  ["Is this a cry for help?", "Which one is more of a cry for help?"],
  ["Would this survive a group chat?", "Which would survive the group chat?"],
  ["Is this person about to send a risky text?", "Who is about to send a risky text?"],
  ["Is this legal?", "Which one is less legal?"],
  ["Does this spark joy?", "Which one sparks more joy?"],
  ["Is this a red flag?", "Which one is the bigger red flag?"],
  ["Would Gordon Ramsay approve?", "Which would Gordon Ramsay approve of?"],
  ["Is this guy a landlord?", "Who is the landlord?"],
  ["Is this a hate crime against food?", "Which one is a worse crime against food?"],
  ["Is this a flex?", "Which one is the bigger flex?"],
  ["Is this peak performance?", "Which one is peak performance?"],
  ["Has this person ever touched grass?", "Who has touched more grass?"],
];

export const QUESTION_BANK: Record<Mode, string[]> = {
  each: QUESTION_PAIRS.map(([each]) => each),
  pick: QUESTION_PAIRS.map(([, pick]) => pick),
};

/** The same idea in the other mode, if `question` is one of ours. */
export function counterpart(question: string, to: Mode): string | undefined {
  const pair = QUESTION_PAIRS.find((p) => p.includes(question.trim()));
  return pair?.[to === "each" ? 0 : 1];
}

export const SPOT_BANK = ["the cat", "the dog", "Waldo", "the remote", "my keys", "the problem"];
