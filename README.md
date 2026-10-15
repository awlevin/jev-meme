# jev-meme

Live at [jevmeme.fun](https://jevmeme.fun). roasts by jev Pick photos, ask a question, get a meme with [Jev](https://typesafe.ai)'s confidence on each.

- **Formats:** Versus, Lineup, Vibe check, Spot it (Jev 1.14 `box`).
- **Stack:** Next.js on Vercel, TypeSafe image inputs (`TypeSafe-Danger-Zone-Images`), Vercel Blob for uploads and memes, Satori for the PNGs.
- **Env:** `TYPESAFE_AI_API_KEY`, `BLOB_READ_WRITE_TOKEN`.

```sh
npm run dev
npx tsx scripts/shots.mts http://localhost:3000 shots   # phone screenshots of the main flows
npx tsx --env-file=.env.local scripts/gen-samples.mts    # regenerate sample photos (AI Gateway)
```
