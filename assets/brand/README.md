# Brand assets

`banner.png` (1280×640) opens the README and is the repository's social
preview. `banner.html` is the source. It uses the same tokens as
`app/globals.css` and pulls its fonts from Google Fonts, so redrawing it
needs a network connection.

`meme.jpg` is a real meme from the app:
[jevmeme.fun/m/5x6pgyLCOe3e](https://jevmeme.fun/m/5x6pgyLCOe3e).

```bash
node assets/brand/render.mjs   # banner.html → assets/brand/banner.png
```

`../fonts/` holds the Inter and JetBrains Mono faces that `lib/render.tsx`
hands to `next/og`, which cannot fetch a stylesheet at render time.
