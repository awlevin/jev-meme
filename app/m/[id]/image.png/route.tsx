import { renderMeme } from "@/lib/render";
import { loadMeme } from "@/lib/store";

export async function GET(_request: Request, { params }: RouteContext<"/m/[id]/image.png">) {
  const meme = await loadMeme((await params).id);
  if (!meme) return new Response("Not found", { status: 404 });
  return renderMeme(meme);
}
