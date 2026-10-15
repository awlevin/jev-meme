import type { FormatId } from "./formats";

// Bundled photos (public/samples, made by scripts/gen-samples.mts).
export const SAMPLE_PHOTOS = [
  { id: "soda-guy", alt: "Man chugging a soda" },
  { id: "wine-sip", alt: "Man sipping wine" },
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
  { format: "versus", photos: ["wine-sip", "soda-guy"], questions: ["Does he enjoy his beverage?"] },
  { format: "versus", photos: ["raccoon-trash", "dog-ball"], questions: ["Is this a good boy?"] },
  { format: "versus", photos: ["hotdog", "taco"], questions: ["Is this a sandwich?"] },
  { format: "versus", photos: ["ladder", "harness"], questions: ["Is this OSHA compliant?"] },
  { format: "versus", photos: ["sneaker", "shoe-cake"], questions: ["Is this cake?"] },
  { format: "versus", photos: ["cat-keyboard", "dog-tie"], questions: ["Ready for Monday?"] },
  { format: "lineup", photos: ["goose", "duckling", "sloth", "raccoon-trash"], questions: ["Would this win a fight?"] },
  {
    format: "vibes",
    photos: ["raccoon-trash"],
    questions: ["Is he guilty?", "Is he sorry?", "Will he do it again?"],
  },
  { format: "spot", photos: ["messy-room"], questions: ["the cat"] },
];

// Prompts for "Need an idea?".
export const QUESTION_BANK: string[] = [
  "Does he enjoy his beverage?",
  "Is this a good boy?",
  "Is this a sandwich?",
  "Is this OSHA compliant?",
  "Ready for Monday?",
  "Would you trust them with your dog?",
  "Is this main character energy?",
  "Did they peak in high school?",
  "Is this a cry for help?",
  "Would this survive a group chat?",
  "Is this person about to send a risky text?",
  "Is this legal?",
  "Does this spark joy?",
  "Is this a red flag?",
  "Would Gordon Ramsay approve?",
  "Is this guy a landlord?",
  "Is this a hate crime against food?",
  "Is this a crime?",
  "Is this peak performance?",
  "Has this person ever touched grass?",
];

export const SPOT_BANK = ["the cat", "the dog", "Waldo", "the remote", "my keys", "the problem"];
