import { Suspense } from "react";
import Link from "next/link";
import { LoadingScreen } from "@/components";
import { generateGameContent } from "@/lib/game-content";
import { shuffle } from "@/lib/shuffle";
import { getRandomSuggestions } from "@/lib/suggestions";
import GameClient, { type GameItem } from "./game";

interface PageProps {
  params: Promise<{ word: string }>;
}

export default async function FindPage({ params }: PageProps) {
  const { word: encodedWord } = await params;
  const word = decodeURIComponent(encodedWord);

  return (
    <Suspense fallback={<LoadingScreen />}>
      <GameContent word={word} />
    </Suspense>
  );
}

async function GameContent({ word }: { word: string }) {
  const data = await generateGameContent(word);

  if (!data) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 overflow-hidden bg-gradient-to-b from-sky-200 to-sky-100 text-slate-900 select-none">
        <p className="text-xl">Could not find game for &quot;{word}&quot;</p>
        <Link
          href="/"
          className="rounded-full bg-sky-500 px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-sky-600"
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

  // Generate suggestions on server
  const suggestions = getRandomSuggestions(4);

  return (
    <GameClient
      word={word}
      type={data.type}
      targetValue={data.targetValue}
      initialItems={items}
      suggestions={suggestions}
    />
  );
}
