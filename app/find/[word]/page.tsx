import Link from "next/link";
import { generateGameContent } from "@/lib/game-content";
import { shuffle } from "@/lib/shuffle";
import GameClient, { type GameItem } from "./game";

interface PageProps {
  params: Promise<{ word: string }>;
}

export default async function FindPage({ params }: PageProps) {
  const { word: encodedWord } = await params;
  const word = decodeURIComponent(encodedWord);

  const data = await generateGameContent(word);

  if (!data) {
    return (
      <div className="h-screen w-screen overflow-hidden text-slate-900 select-none flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-sky-200 to-sky-100">
        <p className="text-xl">Could not find game for &quot;{word}&quot;</p>
        <Link
          href="/"
          className="px-6 py-3 bg-sky-500 text-white rounded-full text-lg font-semibold hover:bg-sky-600 transition-colors"
        >
          Try Another Word
        </Link>
      </div>
    );
  }

  // Build and shuffle items on server to avoid hydration mismatch
  const items: GameItem[] = shuffle([
    {
      id: "target",
      value: data.targetValue,
      isCorrect: true,
    },
    {
      id: "d1",
      value: data.distractors[0],
      isCorrect: false,
    },
    {
      id: "d2",
      value: data.distractors[1],
      isCorrect: false,
    },
  ]);

  return (
    <GameClient
      word={word}
      type={data.type}
      targetValue={data.targetValue}
      initialItems={items}
    />
  );
}
