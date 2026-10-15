// Phone screenshots of the main flows.
// Usage: npx tsx scripts/shots.mts [baseUrl] [outDir] [uploadImage]
import { chromium, devices } from "playwright";

const base = process.argv[2] ?? "http://localhost:3123";
const out = process.argv[3] ?? "shots";
const upload = process.argv[4];

const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices["iPhone 15"] });
const page = await ctx.newPage();
page.on("console", (m) => m.type() === "error" && console.log("console:", m.text()));
const imagesLoaded = () =>
  page.waitForFunction(() => [...document.images].filter((i) => i.src.includes("/image.png")).every((i) => i.complete && i.naturalWidth));

await page.goto(base);
await page.waitForLoadState("networkidle");
await page.screenshot({ path: `${out}/1-home.png` });

// Idea chips appear on focus.
await page.getByRole("textbox", { name: "Question" }).focus();
await page.screenshot({ path: `${out}/2-ideas.png`, fullPage: true });

// Preset → result page.
await page.getByRole("region", { name: "Examples" }).getByRole("button", { name: /best boy/ }).click();
await page.waitForURL(/\/m\//);
await page.getByRole("img", { name: /best boy/ }).waitFor();
await imagesLoaded();
await page.screenshot({ path: `${out}/3-result.png` });

// Find it with a typed target.
await page.getByRole("radio", { name: /Find it/ }).click();
await page.getByRole("button", { name: "Remove pic" }).click();
await page.getByRole("button", { name: "Add pic" }).first().click();
await page.getByRole("button", { name: "Messy living room" }).click();
await page.getByRole("textbox", { name: "What to find" }).fill("the plant");
await page.screenshot({ path: `${out}/4-spot-compose.png`, fullPage: true });
await page.getByRole("button", { name: "Ask Jev" }).click();
await page.getByRole("img", { name: /Where's the plant/ }).waitFor();
await imagesLoaded();
await page.screenshot({ path: `${out}/5-spot-result.png` });

// Upload a photo into Versus.
if (upload) {
  await page.getByRole("radio", { name: /Two pics/ }).click();
  await page.getByRole("button", { name: "Remove pic" }).click();
  await page.getByRole("button", { name: "Add pic" }).first().click();
  await page.screenshot({ path: `${out}/6-picker.png` });
  await page.locator('input[type="file"]').setInputFiles(upload);
  await page.getByRole("button", { name: "Add pic" }).first().click();
  await page.getByRole("button", { name: "Dog with a ball" }).click();
  await page.getByRole("textbox", { name: "Question" }).fill("Who is more hydrated?");
  // Comparative wording flips scoring to "Pick one" on its own.
  await page.getByRole("radio", { name: "Pick one", checked: true }).waitFor();
  await page.screenshot({ path: `${out}/6b-pick-compose.png`, fullPage: true });
  await page.getByRole("button", { name: "Ask Jev" }).click();
  await page.getByRole("img", { name: /hydrated/ }).waitFor();
  await imagesLoaded();
  await page.screenshot({ path: `${out}/7-upload-result.png` });
}

await browser.close();
