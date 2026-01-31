"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GameScreen, SuccessScreen } from "@/components";
import { playSuccessSound, playErrorSound } from "@/lib/audio";
import { getRandomSuggestions } from "@/lib/suggestions";

type Screen = "game" | "success";
type ItemStatus = "normal" | "correct" | "wrong";

export interface GameItem {
  id: string;
  value: string;
  isCorrect: boolean;
}

interface GameItemWithStatus extends GameItem {
  status: ItemStatus;
}

interface GameClientProps {
  word: string;
  type: "color" | "emoji";
  targetValue: string;
  initialItems: GameItem[];
}

export default function GameClient({
  word,
  type,
  targetValue,
  initialItems,
}: GameClientProps) {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("game");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Add status to items (status is client-only state)
  const [items, setItems] = useState<GameItemWithStatus[]>(() =>
    initialItems.map((item) => ({ ...item, status: "normal" as ItemStatus })),
  );

  // Generate suggestions on mount
  useEffect(() => {
    setSuggestions(getRandomSuggestions(4));
  }, []);

  const handleBack = () => {
    router.push("/");
  };

  const handlePlayAgain = () => {
    router.push("/");
  };

  const handleSuggestionClick = (newWord: string) => {
    router.push(`/find/${encodeURIComponent(newWord)}`);
  };

  const handleItemClick = (id: string) => {
    const hasCorrectAnswer = items.some((item) => item.status === "correct");
    if (hasCorrectAnswer) return;

    const clickedItem = items.find((item) => item.id === id);
    if (!clickedItem || clickedItem.status === "wrong") return;

    if (clickedItem.isCorrect) {
      playSuccessSound();
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: "correct" } : item,
        ),
      );
      setTimeout(() => setScreen("success"), 1500);
    } else {
      playErrorSound();
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: "wrong" } : item,
        ),
      );
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden text-slate-900 select-none">
      {screen === "game" && (
        <GameScreen
          inputWord={word}
          items={items}
          type={type}
          onItemClick={handleItemClick}
          onBack={handleBack}
        />
      )}
      {screen === "success" && (
        <SuccessScreen
          inputWord={word}
          targetValue={targetValue}
          type={type}
          suggestions={suggestions}
          onPlayAgain={handlePlayAgain}
          onSuggestionClick={handleSuggestionClick}
        />
      )}
    </div>
  );
}
