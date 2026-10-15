import type { FormatId } from "@/lib/formats";

/** Tiny picture of each meme layout, so the picker shows what you'll get. */
export function FormatGlyph({ id, active }: { id: FormatId; active: boolean }) {
  const tile = active ? "bg-accent" : "bg-current opacity-60";
  const box = "grid h-7 w-10 gap-0.5 overflow-hidden rounded-[5px]";
  if (id === "versus")
    return (
      <span className={`${box} grid-cols-2`}>
        <span className={tile} />
        <span className={tile} />
      </span>
    );
  if (id === "lineup")
    return (
      <span className={`${box} grid-cols-2 grid-rows-2`}>
        <span className={tile} />
        <span className={tile} />
        <span className={tile} />
        <span className={tile} />
      </span>
    );
  if (id === "vibes")
    return (
      <span className={`${box} grid-rows-[1fr_3px_3px]`}>
        <span className={tile} />
        <span className={`${tile} w-4/5`} />
        <span className={`${tile} w-3/5`} />
      </span>
    );
  return (
    <span className={`${box} relative`}>
      <span className={tile} />
      <span
        className={`absolute top-1.5 left-3 size-3.5 rounded-[3px] border-2 ${active ? "border-black" : "border-bg"}`}
      />
    </span>
  );
}
