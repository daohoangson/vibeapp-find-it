"use client";

import { useState } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { Confetti } from "./Confetti";
import { playSuccessSound } from "@/lib/audio";

interface SuccessScreenProps {
  inputWord: string;
  targetValue: string;
  type: "color" | "emoji";
  onPlayAgain: () => void;
}

function TargetDisplay({
  targetValue,
  type,
}: {
  targetValue: string;
  type: "color" | "emoji";
}) {
  if (type === "color") {
    return (
      <div
        className="h-full w-full rounded-2xl"
        style={{ backgroundColor: targetValue }}
        role="img"
        aria-label={`Color: ${targetValue}`}
      />
    );
  }

  return (
    <div
      className="flex h-full w-full items-center justify-center text-8xl leading-none sm:text-9xl"
      role="img"
      aria-label={`Emoji: ${targetValue}`}
    >
      {targetValue}
    </div>
  );
}

export function SuccessScreen({
  inputWord,
  targetValue,
  type,
  onPlayAgain,
}: SuccessScreenProps) {
  const [confettiKey, setConfettiKey] = useState(0);

  const handleTargetTap = () => {
    playSuccessSound();
    setConfettiKey((prev) => prev + 1);
  };

  return (
    <main className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-blue-50 to-indigo-100 p-6">
      <Confetti key={confettiKey} />

      <section className="z-10 flex max-h-full w-full max-w-lg flex-col items-center">
        <div className="mb-4 shrink-0 animate-bounce rounded-full bg-white p-4 shadow-2xl sm:mb-8 sm:p-6">
          <Sparkles
            className="h-12 w-12 text-yellow-400 sm:h-20 sm:w-20"
            fill="currentColor"
          />
        </div>

        <h1 className="mb-2 shrink-0 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-center text-4xl font-black text-transparent sm:mb-4 sm:text-6xl">
          Amazing!
        </h1>
        <p className="mb-6 shrink-0 text-xl font-medium text-slate-600 sm:mb-12 sm:text-2xl">
          You found the {inputWord}!
        </p>

        <button
          onClick={handleTargetTap}
          className="mb-6 shrink-0 rotate-3 cursor-pointer rounded-3xl border-b-8 border-slate-200 bg-white p-4 shadow-2xl transition-transform duration-200 hover:scale-105 hover:rotate-0 focus:ring-2 focus:ring-blue-500 focus:outline-none active:scale-95 sm:mb-12 sm:p-6"
          aria-label="Tap to celebrate again!"
        >
          <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-slate-50 sm:h-64 sm:w-64">
            <TargetDisplay targetValue={targetValue} type={type} />
          </div>
        </button>

        <button
          onClick={onPlayAgain}
          className="flex shrink-0 items-center gap-3 rounded-full bg-green-500 px-8 py-4 text-xl font-bold text-white shadow-lg shadow-green-500/40 transition-all hover:-translate-y-1 hover:bg-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none active:translate-y-1 sm:px-12 sm:py-6 sm:text-2xl"
        >
          <RefreshCw className="h-6 w-6 sm:h-8 sm:w-8" />
          Play Again
        </button>
      </section>
    </main>
  );
}
