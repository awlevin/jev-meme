import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { CSSProperties, ReactNode } from "react";
import { formatScore, memeTitle, type Meme } from "./formats";
import { loadPhoto, photoSize, toDataUrl } from "./photos";

// Every meme is drawn here, with Satori, so the preview, download, share, and
// link card are the same pixels.

const W = 1200;
const PAD = 10;
const GAP = 8;
const INNER = W - PAD * 2;
const ACCENT = "#FFE14D";

const fonts = Promise.all([
  readFile(join(process.cwd(), "assets/fonts/inter-latin-800-normal.woff")),
  readFile(join(process.cwd(), "assets/fonts/jetbrains-mono-latin-800-normal.woff")),
]).then(([inter, mono]) => [
  { name: "Inter", data: inter, weight: 800 as const, style: "normal" as const },
  { name: "Mono", data: mono, weight: 800 as const, style: "normal" as const },
]);

/** Font size and height for the caption bar, from a rough width estimate. */
function caption(text: string) {
  const size = text.length <= 34 ? 56 : text.length <= 70 ? 46 : 38;
  const perLine = Math.floor(INNER / (size * 0.56));
  const lines = Math.min(3, Math.ceil(text.length / perLine));
  return { size, height: lines * Math.round(size * 1.18) + 44 };
}

/** A white number with a heavy black outline, like the classic meme. */
function Score({ value, size }: { value: string; size: number }) {
  return (
    <div
      style={{
        display: "flex",
        fontFamily: "Mono",
        fontSize: size,
        color: "#fff",
        lineHeight: 1,
        WebkitTextStroke: `${Math.max(3, Math.round(size / 22))}px #000`,
        paintOrder: "stroke fill",
      }}
    >
      {value}
    </div>
  );
}

function Caption({ text }: { text: string }) {
  const { size, height } = caption(text);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height,
        padding: "0 28px",
        fontFamily: "Inter",
        fontSize: size,
        color: "#fff",
        textAlign: "center",
        lineHeight: 1.18,
      }}
    >
      {text}
    </div>
  );
}

function Watermark() {
  return (
    <div
      style={{
        display: "flex",
        position: "absolute",
        left: 14,
        top: 12,
        fontFamily: "Mono",
        fontSize: 20,
        color: "rgba(255,255,255,0.8)",
        textShadow: "0 1px 4px rgba(0,0,0,0.9)",
      }}
    >
      jev-meme
    </div>
  );
}

function Cell({ src, width, height, score, scoreSize, mark, style }: {
  src: string;
  width: number;
  height: number;
  score?: number;
  scoreSize: number;
  mark?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div style={{ display: "flex", position: "relative", width, height, overflow: "hidden", borderRadius: 6, ...style }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} width={width} height={height} style={{ objectFit: "cover", width, height }} alt="" />
      {mark && <Watermark />}
      {score !== undefined && (
        <div style={{ display: "flex", position: "absolute", left: 0, right: 0, bottom: Math.round(scoreSize * 0.28), justifyContent: "center" }}>
          <Score value={formatScore(score)} size={scoreSize} />
        </div>
      )}
    </div>
  );
}

type Drawn = { node: ReactNode; height: number };

function drawGrid(meme: Meme, srcs: string[]): Drawn {
  const n = srcs.length;
  const cols = n === 4 ? 2 : n;
  const rows = Math.ceil(n / cols);
  const cellW = Math.floor((INNER - GAP * (cols - 1)) / cols);
  const cellH = n === 2 ? 640 : n === 3 ? 520 : 470;
  const scoreSize = n === 2 ? 150 : n === 3 ? 108 : 120;
  const cap = caption(meme.questions[0]);
  const height = PAD * 2 + cap.height + rows * cellH + (rows - 1) * GAP;
  return {
    height,
    node: (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <Caption text={meme.questions[0]} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: GAP, width: INNER }}>
          {srcs.map((src, i) => (
            <Cell key={i} src={src} width={cellW} height={cellH} score={meme.scores[i]} scoreSize={scoreSize} mark={i === 0} />
          ))}
        </div>
      </div>
    ),
  };
}

function drawVibes(meme: Meme, src: string): Drawn {
  const photoH = 760;
  const rowH = 108;
  const height = PAD * 2 + photoH + GAP + meme.questions.length * rowH;
  return {
    height,
    node: (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <Cell src={src} width={INNER} height={photoH} scoreSize={0} mark />
        <div style={{ display: "flex", flexDirection: "column", marginTop: GAP }}>
          {meme.questions.map((q, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                height: rowH,
                padding: "0 28px",
                borderTop: i ? "2px solid #222" : "none",
              }}
            >
              <div style={{ display: "flex", fontFamily: "Inter", fontSize: q.length > 40 ? 34 : 44, color: "#fff", maxWidth: 820 }}>{q}</div>
              <Score value={formatScore(meme.scores[i])} size={76} />
            </div>
          ))}
        </div>
      </div>
    ),
  };
}

function drawSpot(meme: Meme, src: string): Drawn {
  const img = meme.images[0];
  const width = INNER;
  const photoH = Math.min(1400, Math.round((INNER * img.height) / img.width));
  const title = memeTitle(meme);
  const cap = caption(title);
  const { edges, confidence } = meme.box!;
  const box = {
    left: edges.left * width,
    top: edges.top * photoH,
    width: (edges.right - edges.left) * width,
    height: (edges.bottom - edges.top) * photoH,
  };
  const labelAbove = box.top > 90;
  return {
    height: PAD * 2 + cap.height + photoH,
    node: (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <Caption text={title} />
        <div style={{ display: "flex", position: "relative", width, height: photoH, overflow: "hidden", borderRadius: 6 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} width={width} height={photoH} style={{ objectFit: "cover", width, height: photoH }} alt="" />
          <Watermark />
          <div
            style={{
              display: "flex",
              position: "absolute",
              ...box,
              border: `8px solid ${ACCENT}`,
              borderRadius: 10,
              boxShadow: "0 0 0 4px #000, inset 0 0 0 4px #000",
            }}
          />
          {confidence !== null && (
            <div
              style={{
                display: "flex",
                position: "absolute",
                left: Math.min(Math.max(box.left, 0), width - 220),
                top: labelAbove ? box.top - 88 : box.top + box.height + 8,
                padding: "6px 16px",
                background: ACCENT,
                borderRadius: 10,
                border: "4px solid #000",
                fontFamily: "Mono",
                fontSize: 60,
                color: "#000",
                lineHeight: 1,
              }}
            >
              {formatScore(confidence)}
            </div>
          )}
        </div>
      </div>
    ),
  };
}

async function draw(meme: Meme): Promise<Drawn> {
  const srcs = await Promise.all(meme.images.map(async (img) => toDataUrl(await loadPhoto(img.url))));
  if (meme.format === "vibes") return drawVibes(meme, srcs[0]);
  if (meme.format === "spot") return drawSpot(meme, srcs[0]);
  return drawGrid(meme, srcs);
}

// Ids are content hashes, but the renderer can change between deploys; the CDN cache resets per deploy.
const CACHE = { "Cache-Control": "public, max-age=300, s-maxage=31536000" };

/** The meme itself, full size. */
export async function renderMeme(meme: Meme): Promise<ImageResponse> {
  const { node, height } = await draw(meme);
  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: W, height, padding: PAD, background: "#000" }}>
        {node}
      </div>
    ),
    { width: W, height, fonts: await fonts, headers: CACHE },
  );
}

/** 1200×630 link card: the meme, letterboxed, so X never crops the caption. */
export async function renderCard(meme: Meme): Promise<ImageResponse> {
  const png = new Uint8Array(await (await renderMeme(meme)).arrayBuffer());
  const { width, height } = photoSize(png);
  const scale = Math.min(630 / height, 1200 / width);
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: 1200, height: 630, background: "#000", alignItems: "center", justifyContent: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={toDataUrl(png)} width={Math.round(width * scale)} height={Math.round(height * scale)} alt="" />
      </div>
    ),
    { width: 1200, height: 630, headers: CACHE },
  );
}
