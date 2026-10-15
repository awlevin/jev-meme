import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Studio } from "@/components/studio";
import { memeTitle } from "@/lib/formats";
import { loadMeme } from "@/lib/store";

export async function generateMetadata({ params }: PageProps<"/m/[id]">): Promise<Metadata> {
  const { id } = await params;
  const meme = await loadMeme(id);
  if (!meme) return {};
  const title = memeTitle(meme);
  const images = [{ url: `/m/${id}/card.png`, width: 1200, height: 630, alt: title }];
  return {
    title: `${title} · jev-meme`,
    description: "Rated by Jev.",
    openGraph: { title, description: "Rated by Jev.", images, url: `/m/${id}` },
    twitter: { card: "summary_large_image", title, description: "Rated by Jev.", images },
  };
}

export default async function MemePage({ params }: PageProps<"/m/[id]">) {
  const { id } = await params;
  const meme = await loadMeme(id);
  if (!meme) notFound();
  return <Studio initial={{ id, title: memeTitle(meme) }} />;
}
