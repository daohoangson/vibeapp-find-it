"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isSpeechAvailable, speakWord } from "@/lib/speech";
import { playPopSound } from "@/lib/audio";
import { useSoundSettings } from "@/lib/hooks";
import { PageHeader } from "./PageHeader";

export interface GameItem {
  id: string;
  value: string;
  isCorrect: boolean;
  status: "normal" | "wrong" | "correct";
}

interface GameScreenProps {
  inputWord: string;
  items: GameItem[];
  type: "color" | "emoji";
  onItemClick: (id: string) => void;
  backHref?: string;
}

function CardContent({
  item,
  type,
}: {
  item: GameItem;
  type: "color" | "emoji";
}) {
  if (type === "color") {
    return (
      <div
        className="h-full w-full rounded-2xl border-2 border-black/5 shadow-inner sm:rounded-3xl"
        style={{ backgroundColor: item.value }}
      />
    );
  }

  return (
    <div
      className="flex h-full w-full items-center justify-center leading-none drop-shadow-sm filter select-none"
      style={{ fontSize: "min(20vh, 20vw)" }}
    >
      {item.value}
    </div>
  );
}

export function GameScreen({
  inputWord,
  items,
  type,
  onItemClick,
  backHref = "/",
}: GameScreenProps) {
  const hasCorrectAnswer = items.some((item) => item.status === "correct");
  const { soundEnabled } = useSoundSettings();
  const router = useRouter();

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "Escape") {
        playPopSound();
        router.push(backHref);
        return;
      }

      const keyMap: Record<string, number> = {
        "1": 0,
        a: 0,
        "2": 1,
        s: 1,
        b: 1,
        "3": 2,
        d: 2,
        c: 2,
      };

      if (e.key in keyMap) {
        const index = keyMap[e.key];
        const item = items[index];
        // Only click if item is valid and clickable
        if (
          item &&
          item.status !== "wrong" &&
          item.status !== "correct" &&
          !hasCorrectAnswer
        ) {
          onItemClick(item.id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [items, hasCorrectAnswer, router, onItemClick, backHref]);

  // Announce the word when the game screen loads
  useEffect(() => {
    if (isSpeechAvailable() && soundEnabled) {
      // Small delay to let the screen render first
      const timer = setTimeout(() => {
        speakWord(inputWord);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [inputWord, soundEnabled]);

  const handleSpeakClick = () => {
    if (!isSpeechAvailable()) return;
    playPopSound();
    speakWord(inputWord);
  };

  const wordButton = (
    <button
      onClick={handleSpeakClick}
      className="mx-4 flex max-w-[70%] cursor-pointer touch-manipulation items-center justify-center truncate rounded-full border-b-4 border-sky-100 bg-white/90 px-8 py-3 shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:border-sky-200 active:scale-95 sm:px-10"
    >
      <h2 className="truncate text-xl font-black tracking-tight text-slate-800 sm:text-3xl">
        Find:{" "}
        <span className="text-sky-600 capitalize underline decoration-sky-300 decoration-solid decoration-2 underline-offset-4">
          {inputWord}
        </span>
      </h2>
    </button>
  );

  return (
    <main className="fixed inset-0 flex flex-col items-center overflow-hidden bg-gradient-to-br from-sky-100 via-blue-50 to-emerald-50">
      <PageHeader
        backHref={backHref}
        centerContent={wordButton}
        sticky={false}
        showBackground={false}
        className="shrink-0"
      />

      {/* Game Area */}
      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col items-stretch justify-center gap-4 p-4 sm:gap-8 sm:p-8 landscape:flex-row">
        {items.map((item, index) => {
          const isWrong = item.status === "wrong";
          const isCorrect = item.status === "correct";

          return (
            <button
              key={`${item.id}-${item.status}`}
              onClick={() => onItemClick(item.id)}
              disabled={isWrong || hasCorrectAnswer}
              aria-label={`Option: ${item.value}`}
              style={{
                animationDelay:
                  item.status === "normal" ? `${index * 150}ms` : "0ms",
              }}
              className={`relative min-h-0 min-w-0 flex-1 cursor-pointer touch-manipulation overflow-hidden rounded-3xl border-b-[8px] focus:outline-none sm:rounded-[2.5rem] sm:border-b-[12px] ${
                isWrong
                  ? "cursor-not-allowed border-transparent bg-slate-100 opacity-50 shadow-none grayscale"
                  : "transform transition-all duration-300"
              } ${
                !isWrong && !isCorrect
                  ? "animate-pop-in border-slate-200 bg-white shadow-xl"
                  : ""
              } ${
                !isWrong && !isCorrect && !hasCorrectAnswer
                  ? "hover:-translate-y-1 hover:scale-[1.02] hover:shadow-2xl focus:ring-4 focus:ring-sky-500/30 active:translate-y-0 active:scale-[0.98] active:border-b-4"
                  : ""
              } ${
                !isWrong && !isCorrect && hasCorrectAnswer
                  ? "cursor-default opacity-50 grayscale"
                  : ""
              } ${
                isCorrect
                  ? "z-10 scale-105 border-green-500 bg-green-50 ring-4 shadow-green-200 ring-green-400 ring-offset-4 ring-offset-transparent"
                  : ""
              } `}
            >
              <div
                className={`pointer-events-none absolute inset-3 flex items-center justify-center overflow-hidden rounded-2xl bg-slate-50/50 sm:inset-5 sm:rounded-3xl ${
                  isWrong ? "animate-shake" : ""
                }`}
              >
                {isCorrect && (
                  <div className="absolute inset-0 z-10 animate-pulse bg-green-400/20" />
                )}
                <CardContent item={item} type={type} />
              </div>
            </button>
          );
        })}
      </div>
    </main>
  );
}
