import { useState, useSyncExternalStore } from "react";
import { memeUrl } from "@/lib/site";
import { Button, LinkButton } from "./ui/button";

const noop = () => () => {};

/** Phones can hand the PNG itself to the share sheet (X, Messages, Photos). */
function canShareImages() {
  const probe = new File([new Blob()], "x.png", { type: "image/png" });
  return Boolean(navigator.canShare?.({ files: [probe] }));
}

/** The finished meme plus one-tap sharing. */
export function Result({ id, title }: { id: string; title: string }) {
  const src = `/m/${id}/image.png`;
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const loaded = loadedSrc === src;
  const [copied, setCopied] = useState(false);
  const canShareFiles = useSyncExternalStore(noop, canShareImages, () => false);

  const pageUrl = memeUrl(id);
  const tweet = `https://x.com/intent/post?${new URLSearchParams({ text: title, url: pageUrl })}`;

  async function file() {
    const blob = await (await fetch(src)).blob();
    return new File([blob], `jevmeme-${id}.png`, { type: "image/png" });
  }

  async function share() {
    try {
      await navigator.share({ files: [await file()], text: title, url: pageUrl });
    } catch {
      // Dismissed.
    }
  }

  async function save() {
    const url = URL.createObjectURL(await file());
    const a = Object.assign(document.createElement("a"), { href: url, download: `jevmeme-${id}.png` });
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <section aria-label="Your meme" className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-2xl border border-line bg-black">
        {!loaded && <div className="shimmer aspect-[1200/760] w-full" />}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={src}
          src={src}
          alt={title}
          onLoad={() => setLoadedSrc(src)}
          className={loaded ? "block w-full" : "absolute inset-0 opacity-0"}
        />
      </div>
      <div className="flex gap-2">
        <LinkButton href={tweet} target="_blank" rel="noopener" variant="primary" size="lg" className="flex-1">
          <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
            <path d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.77L17.75 3Zm-1.08 16.2h1.7L7.4 4.73H5.58l11.09 14.47Z" />
          </svg>
          Post
        </LinkButton>
        {canShareFiles ? (
          <Button onClick={share} size="lg" className="flex-1">Share</Button>
        ) : (
          <Button onClick={save} size="lg" className="flex-1">Save</Button>
        )}
        <Button onClick={copyLink} size="lg" className="flex-1" aria-live="polite">
          {copied ? "Copied" : "Link"}
        </Button>
      </div>
    </section>
  );
}
