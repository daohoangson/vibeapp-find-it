"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { InputScreen } from "@/components";
import { unlockAudio } from "@/lib/audio";
import { getRandomSuggestions } from "@/lib/suggestions";

export default function Home() {
  const router = useRouter();
  const [inputWord, setInputWord] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Generate suggestions on mount
  useEffect(() => {
    setSuggestions(getRandomSuggestions(4));
  }, []);

  const startGame = async (word: string) => {
    if (!word.trim()) return;

    // Unlock audio on user interaction (required for iOS/Chrome)
    await unlockAudio();

    // Navigate to the game page
    router.push(`/find/${encodeURIComponent(word.trim())}`);
  };

  const handleStart = () => startGame(inputWord);

  const handleSuggestionClick = (word: string) => startGame(word);

  return (
    <div className="h-screen w-screen overflow-hidden text-slate-900 select-none">
      <InputScreen
        inputWord={inputWord}
        errorMsg=""
        isLoading={false}
        suggestions={suggestions}
        onInputChange={setInputWord}
        onStart={handleStart}
        onSuggestionClick={handleSuggestionClick}
      />
    </div>
  );
}
