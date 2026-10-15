import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default async function Icon() {
  const mono = await readFile(join(process.cwd(), "assets/fonts/jetbrains-mono-latin-800-normal.woff"));
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffe14d",
          borderRadius: 14,
          fontFamily: "Mono",
          fontSize: 26,
          color: "#000",
          letterSpacing: -1,
        }}
      >
        .99
      </div>
    ),
    { ...size, fonts: [{ name: "Mono", data: mono, weight: 800, style: "normal" }] },
  );
}
