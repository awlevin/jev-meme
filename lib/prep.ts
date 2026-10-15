// Browser-side photo prep: upright, JPEG, and inside Jev's size limits
// (each side 256–1568 px, at least 78,400 px total).

const MAX_SIDE = 1280;
const MIN_SIDE = 320;

export async function prepPhoto(file: File): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("Can't read that pic.");
  }
  const { width, height } = bitmap;
  const scale = Math.min(MAX_SIDE / Math.max(width, height), Math.max(1, MIN_SIDE / Math.min(width, height)));
  // Very long panoramas can't satisfy both limits; pad the short side instead of distorting.
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(w, MIN_SIDE);
  canvas.height = Math.max(h, MIN_SIDE);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.88));
  if (!blob) throw new Error("Can't read that pic.");
  return blob;
}
