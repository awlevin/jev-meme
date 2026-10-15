"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FORMAT_IDS, FORMATS, MAX_QUESTION_LENGTH, memeTitle, type FormatId } from "@/lib/formats";
import { prepPhoto } from "@/lib/prep";
import { PRESETS, QUESTION_BANK, SAMPLE_PHOTOS, samplePath, SPOT_BANK, type Preset } from "@/lib/samples";
import { FormatGlyph } from "./format-glyph";
import { Result } from "./result";
import { Button } from "./ui/button";
import { Sheet } from "./ui/sheet";

type Photo = { kind: "sample"; id: string } | { kind: "upload"; blob: Blob; preview: string };

type Shown = { id: string; title: string };

const pick = <T,>(list: readonly T[], not?: T) => {
  const pool = list.filter((x) => x !== not);
  return pool[Math.floor(Math.random() * pool.length)];
};

export function Studio({ initial }: { initial?: Shown | "loading" }) {
  const [shown, setShown] = useState<Shown | undefined>(initial === "loading" ? undefined : initial);
  const [format, setFormat] = useState<FormatId>("versus");
  const [photos, setPhotos] = useState<(Photo | null)[]>([null, null]);
  const [questions, setQuestions] = useState<string[]>([""]);
  const [picking, setPicking] = useState<number | null>(null);
  const [ideas, setIdeas] = useState<{ slot: number; list: string[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const top = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (shown) document.title = `${shown.title} · jevmeme.fun`;
  }, [shown]);

  const spec = FORMATS[format];
  const filled = photos.filter((p): p is Photo => p !== null);
  const asked = questions.map((q) => q.trim()).filter(Boolean);
  const ready = filled.length >= spec.minImages && asked.length > 0 && !busy;

  function switchFormat(next: FormatId) {
    const f = FORMATS[next];
    setFormat(next);
    setPhotos((prev) => Array.from({ length: f.maxImages }, (_, i) => prev[i] ?? null));
    setQuestions((prev) => prev.slice(0, f.maxQuestions));
    setError(null);
  }

  async function create(f: FormatId, ps: Photo[], qs: string[]) {
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.set("format", f);
      body.set("questions", JSON.stringify(qs));
      for (const p of ps) {
        if (p.kind === "sample") body.append("photo", `sample:${p.id}`);
        else body.append("photo", p.blob, "photo.jpg");
      }
      const res = await fetch("/api/meme", { method: "POST", body });
      const data = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
      if (!res.ok || !data.id) throw new Error(data.error ?? "Something broke. Try again.");
      const title = memeTitle({ format: f, questions: qs });
      setShown({ id: data.id, title });
      window.history.pushState(null, "", `/m/${data.id}`);
      top.current?.scrollIntoView({ behavior: "smooth" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something broke. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function runPreset(preset: Preset) {
    const ps: Photo[] = preset.photos.map((id) => ({ kind: "sample", id }));
    const f = FORMATS[preset.format];
    setFormat(preset.format);
    setPhotos(Array.from({ length: f.maxImages }, (_, i) => ps[i] ?? null));
    setQuestions(preset.questions);
    void create(preset.format, ps, preset.questions);
  }

  function setPhoto(slot: number, photo: Photo | null) {
    setPhotos((prev) => prev.map((p, i) => (i === slot ? photo : p)));
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file === undefined || picking === null) return;
    const slot = picking;
    setPicking(null);
    try {
      const blob = await prepPhoto(file);
      setPhoto(slot, { kind: "upload", blob, preview: URL.createObjectURL(blob) });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Can't read that pic.");
    }
  }

  function showIdeas(slot: number) {
    const bank = format === "spot" ? SPOT_BANK : QUESTION_BANK;
    setIdeas({ slot, list: [...bank].sort(() => Math.random() - 0.5).slice(0, 4) });
  }

  function setQuestion(i: number, value: string) {
    setQuestions((prev) => prev.map((x, j) => (j === i ? value : x)));
  }

  function roll(i: number) {
    const bank = format === "spot" ? SPOT_BANK : QUESTION_BANK;
    setQuestions((prev) => prev.map((q, j) => (j === i ? pick(bank, q) : q)));
  }

  return (
    <div ref={top} className="mx-auto flex w-full max-w-xl scroll-mt-4 flex-col gap-6 px-4 pt-4 pb-16">
      <header className="flex items-center justify-between">
        <Link href="/" className="font-mono text-lg font-extrabold tracking-tight">
          jevmeme<span className="text-accent">.fun</span>
        </Link>
        <a href="https://typesafe.ai" target="_blank" rel="noopener" className="text-xs text-muted hover:text-text">
          by Jev
        </a>
      </header>

      {shown ? (
        <Result id={shown.id} title={shown.title} />
      ) : initial === "loading" ? (
        <div className="shimmer aspect-[1200/760] w-full rounded-2xl" />
      ) : (
        <h1 className="text-[2rem] leading-tight font-extrabold tracking-tight text-balance">AI rates your pics.</h1>
      )}

      <section aria-label="Examples" className="-mx-4">
        <h2 className="px-4 pb-2 text-sm font-semibold text-muted">{shown ? "Try another" : "Tap one"}</h2>
        <div className="no-scrollbar flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-1">
          {PRESETS.map((preset) => (
            <button
              key={preset.questions[0] + preset.photos.join()}
              type="button"
              disabled={busy}
              onClick={() => runPreset(preset)}
              className="flex w-40 shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-line bg-surface text-left transition hover:border-muted active:scale-[0.98] disabled:opacity-50"
            >
              <div className="flex h-24 gap-0.5 bg-black">
                {preset.photos.slice(0, 2).map((id) => (
                  <div key={id} className="relative min-w-0 flex-1">
                    <Image src={samplePath(id)} alt="" fill sizes="80px" className="object-cover" />
                  </div>
                ))}
              </div>
              <span className="line-clamp-2 px-3 py-2 text-sm leading-snug font-semibold">
                {preset.format === "spot" ? `Where's ${preset.questions[0]}?` : preset.questions[0]}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section aria-label="Make your own" className="flex flex-col gap-4 rounded-3xl border border-line bg-surface p-4">
        <h2 className="font-semibold">Make your own</h2>

        <div role="radiogroup" aria-label="Layout" className="grid grid-cols-4 gap-2">
          {FORMAT_IDS.map((id) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={format === id}
              onClick={() => switchFormat(id)}
              className={`flex flex-col items-center gap-1.5 rounded-2xl border px-1 pt-2.5 pb-2 transition ${
                format === id
                  ? "border-accent bg-accent/10 text-text"
                  : "border-line text-muted hover:border-muted hover:text-text"
              }`}
            >
              <FormatGlyph id={id} active={format === id} />
              <span className="text-xs font-semibold whitespace-nowrap">{FORMATS[id].name}</span>
            </button>
          ))}
        </div>

        <div
          className={`grid gap-2 ${photos.length === 1 ? "grid-cols-1" : photos.length === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}
        >
          {photos.map((photo, i) => (
            <div
              key={i}
              className={`relative overflow-hidden rounded-2xl bg-surface-2 ${photos.length === 1 ? "aspect-[4/3]" : "aspect-square"}`}
            >
              {photo ? (
                <>
                  {photo.kind === "sample" ? (
                    <Image
                      src={samplePath(photo.id)}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 50vw, 280px"
                      className="object-cover"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo.preview} alt="" className="size-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => setPhoto(i, null)}
                    aria-label="Remove pic"
                    className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-black/70 text-white backdrop-blur hover:bg-black"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="size-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    >
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setPicking(i)}
                  className="flex size-full flex-col items-center justify-center gap-1 border-2 border-dashed border-line text-muted transition hover:border-muted hover:text-text"
                  style={{ borderRadius: "inherit" }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="size-7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  <span className="text-sm font-medium">{i < spec.minImages ? "Add pic" : "Optional"}</span>
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          {questions.map((q, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="flex items-center gap-2 rounded-2xl bg-surface-2 pr-1.5 pl-4 focus-within:ring-2 focus-within:ring-accent">
                {format === "spot" && <span className="-mr-1 shrink-0 text-muted">Where&apos;s</span>}
                <input
                  value={q}
                  onChange={(e) => setQuestion(i, e.target.value)}
                  onFocus={() => showIdeas(i)}
                  onBlur={() => setIdeas(null)}
                  onKeyDown={(e) => e.key === "Enter" && ready && create(format, filled, asked)}
                  placeholder={i === 0 ? spec.placeholder : "Another question?"}
                  maxLength={MAX_QUESTION_LENGTH}
                  enterKeyHint="go"
                  aria-label={format === "spot" ? "What to find" : "Question"}
                  className="h-13 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted/70"
                />
                <button
                  type="button"
                  onClick={() => roll(i)}
                  aria-label="Random idea"
                  title="Random idea"
                  className="grid size-10 shrink-0 place-items-center rounded-xl text-muted transition hover:bg-line hover:text-text active:rotate-90"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="size-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  >
                    <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
                    <circle cx="8.5" cy="8.5" r="1.3" fill="currentColor" stroke="none" />
                    <circle cx="15.5" cy="15.5" r="1.3" fill="currentColor" stroke="none" />
                    <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
                  </svg>
                </button>
              </div>
              {ideas?.slot === i && !q.trim() && (
                <div className="flex flex-wrap gap-1.5">
                  {ideas.list.map((idea) => (
                    <button
                      key={idea}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setQuestion(i, idea)}
                      className="rounded-full border border-line px-3 py-1.5 text-sm text-muted transition hover:border-muted hover:text-text"
                    >
                      {idea}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {questions.length < spec.maxQuestions && (
            <button
              type="button"
              onClick={() => setQuestions((prev) => [...prev, ""])}
              className="self-start px-1 text-sm text-muted hover:text-text"
            >
              + Add question
            </button>
          )}
        </div>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <Button variant="primary" size="lg" disabled={!ready} onClick={() => create(format, filled, asked)}>
          {busy ? (
            <>
              <span className="size-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
              Asking Jev…
            </>
          ) : (
            "Ask Jev"
          )}
        </Button>
      </section>

      <footer className="flex flex-col items-center gap-1.5 text-xs text-muted">
        <p>
          Scores are Jev&apos;s real confidence.{" "}
          <a
            href="https://docs.typesafe.ai/images"
            target="_blank"
            rel="noopener"
            className="underline underline-offset-2 hover:text-text"
          >
            How
          </a>
        </p>
        <p className="flex gap-3">
          <a href="https://aaronideas.com" target="_blank" rel="noopener" className="hover:text-text">
            by aaron
          </a>
          <a href="https://x.com/awlevin" target="_blank" rel="noopener" className="hover:text-text">
            @awlevin
          </a>
          <a href="https://github.com/awlevin/jev-meme" target="_blank" rel="noopener" className="hover:text-text">
            code
          </a>
        </p>
      </footer>

      <input ref={fileInput} type="file" accept="image/*" hidden onChange={onFile} />

      <Sheet open={picking !== null} onClose={() => setPicking(null)} title="Add a pic">
        <Button variant="primary" size="lg" className="mb-4 w-full" onClick={() => fileInput.current?.click()}>
          Upload
        </Button>
        <div className="grid grid-cols-4 gap-2">
          {SAMPLE_PHOTOS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                if (picking !== null) setPhoto(picking, { kind: "sample", id: p.id });
                setPicking(null);
              }}
              className="relative aspect-square overflow-hidden rounded-xl transition hover:opacity-80 active:scale-95"
            >
              <Image src={samplePath(p.id)} alt={p.alt} fill sizes="100px" className="object-cover" />
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}
