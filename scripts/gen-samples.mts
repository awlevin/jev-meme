// Generates the bundled sample photos via Vercel AI Gateway.
// Usage: npx tsx --env-file=.env.local scripts/gen-samples.mts [id ...]
import { generateImage } from "ai";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const STYLE =
  "Candid smartphone photo, natural light, realistic, sharp focus, no text, no watermark.";

const PROMPTS: Record<string, string> = {
  "soda-guy":
    "A man in his 30s wearing a black hoodie and over-ear headphones, eyes closed in bliss, chugging a silver soda can at an office desk, webcam angle from slightly below, office ceiling tiles.",
  "wine-sip":
    "A man in a navy suit at a fancy dim restaurant cautiously sipping red wine from a large glass, visibly unimpressed, slight grimace.",
  "dog-ball":
    "A golden retriever proudly holding a tennis ball in its mouth on green grass in a sunny park, looking straight at the camera.",
  "raccoon-trash":
    "A raccoon peeking out of a tipped-over garbage can at night, caught in camera flash, holding a pizza crust, guilty expression.",
  hotdog: "A single hot dog with yellow mustard on a paper plate on a picnic table, top-down three-quarter view.",
  taco: "A single beef taco with lettuce and cheese on a plain white plate on a wooden table.",
  "shoe-cake":
    "A hyperrealistic cake shaped exactly like a white sneaker on a cake board, with one slice cut out revealing chocolate sponge inside, bakery counter.",
  sneaker: "A single clean white sneaker on a wooden table, product-style but casual.",
  "cat-keyboard": "A gray tabby cat fast asleep sprawled across an open laptop keyboard on a messy desk, morning light.",
  "dog-tie":
    "A dachshund wearing a tiny necktie sitting upright in an office chair at a desk with a laptop, alert and focused.",
  ladder:
    "A man on a wobbly wooden ladder balanced on a wheelbarrow, holding a chainsaw toward a tree branch, backyard, no safety gear.",
  harness:
    "A construction worker in hard hat, hi-vis vest and full safety harness clipped to a guardrail on steel scaffolding, thumbs up.",
  goose: "An angry Canada goose hissing at the camera with wings spread wide in a park.",
  duckling: "A tiny fluffy yellow duckling standing on grass, looking up at the camera.",
  sloth: "A smiling sloth hanging lazily from a tree branch in a rainforest.",
  "messy-room":
    "A cluttered cozy living room with a couch covered in many patterned pillows and blankets, books, plants, and a small orange cat curled up and partially hidden among the pillows on the left side of the couch.",
};

const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(PROMPTS);
const tmp = mkdtempSync(join(tmpdir(), "jev-samples-"));

// The gateway allows 5 image requests per minute, so go one at a time and wait on 429s.
for (const id of ids) {
  const out = `public/samples/${id}.jpg`;
  if (existsSync(out) && !process.argv.includes(id)) continue;
  for (;;) {
    try {
      const { image } = await generateImage({
        model: "bfl/flux-2-pro",
        prompt: `${PROMPTS[id]} ${STYLE}`,
        aspectRatio: "1:1",
        maxRetries: 0,
      });
      const raw = join(tmp, `${id}.bin`);
      writeFileSync(raw, image.uint8Array);
      execFileSync("magick", [raw, "-resize", "1024x1024>", "-strip", "-interlace", "none", "-quality", "86", out]);
      console.log("✓", id);
      break;
    } catch (error) {
      if (!String(error).includes("Rate limit")) throw error;
      await new Promise((resolve) => setTimeout(resolve, 15_000));
    }
  }
}
