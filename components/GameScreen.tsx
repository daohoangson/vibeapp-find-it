"use client";

import { useEffect } from "react";
import { ArrowLeft, Volume2 } from "lucide-react";
import { isSpeechAvailable, speakWord } from "@/lib/speech";

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
  onBack: () => void;
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
        className="h-full w-full rounded-2xl sm:rounded-3xl shadow-inner border-2 border-black/5"
        style={{ backgroundColor: item.value }}
      />
    );
  }

  return (
    <div
      className="flex h-full w-full items-center justify-center leading-none select-none drop-shadow-sm filter"
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
  onBack,
}: GameScreenProps) {
  const hasCorrectAnswer = items.some((item) => item.status === "correct");
  const speechAvailable = isSpeechAvailable();

  // Announce the word when the game screen loads
  useEffect(() => {
    if (speechAvailable) {
      // Small delay to let the screen render first
      const timer = setTimeout(() => {
        speakWord(inputWord);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [inputWord, speechAvailable]);

  const handleSpeakClick = () => {
    speakWord(inputWord);
  };

  return (
    <main className="fixed inset-0 flex flex-col items-center overflow-hidden bg-gradient-to-br from-sky-100 via-blue-50 to-emerald-50">
      {/* Header */}
      <div className="z-20 flex w-full shrink-0 items-center justify-between px-4 py-4 sm:px-6">
        <button
          onClick={onBack}
          aria-label="Go back"
          className="rounded-full bg-white/80 p-3 text-slate-400 shadow-sm backdrop-blur-md transition-all hover:bg-white hover:text-sky-600 hover:shadow-md hover:scale-105 active:scale-95 focus:ring-2 focus:ring-sky-500 focus:outline-none"
        >
          <ArrowLeft className="h-6 w-6 stroke-[3px]" />
        </button>
        
        <div className="mx-4 flex max-w-[70%] items-center gap-2 truncate rounded-full border-b-4 border-sky-100 bg-white/90 px-6 py-3 shadow-lg backdrop-blur-md sm:px-8">
          <h2 className="truncate text-xl font-black tracking-tight text-slate-800 sm:text-3xl">
            Find: <span className="text-sky-600 capitalize">{inputWord}</span>
          </h2>
          {speechAvailable && (
            <button
              onClick={handleSpeakClick}
              aria-label={`Listen to ${inputWord}`}
              className="ml-1 shrink-0 rounded-full p-2 text-sky-400 transition-all hover:bg-sky-50 hover:text-sky-600 focus:ring-2 focus:ring-sky-500 focus:outline-none active:scale-90"
            >
              <Volume2 className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          )}
        </div>
        
        <div className="w-12" /> {/* Spacer for centering */}
      </div>

      {/* Game Area */}
      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col items-stretch justify-center gap-4 p-4 sm:gap-8 sm:p-8 landscape:flex-row">
        {items.map((item) => {
          const isWrong = item.status === "wrong";
          const isCorrect = item.status === "correct";

          return (
            <button
              key={item.id}
              onClick={() => onItemClick(item.id)}
              disabled={isWrong || hasCorrectAnswer}
              aria-label={`Option: ${item.value}`}
              className={`
                relative min-h-0 min-w-0 flex-1 transform overflow-hidden rounded-3xl border-b-[8px] transition-all duration-300 focus:outline-none sm:rounded-[2.5rem] sm:border-b-[12px]
                ${
                  !isWrong && !isCorrect 
                    ? "bg-white border-slate-200 shadow-xl" 
                    : ""
                }
                ${
                  !isWrong && !isCorrect && !hasCorrectAnswer 
                    ? "hover:scale-[1.02] hover:-translate-y-1 hover:shadow-2xl active:scale-[0.98] active:translate-y-0 active:border-b-4 focus:ring-4 focus:ring-sky-500/30" 
                    : ""
                }
                ${
                  !isWrong && !isCorrect && hasCorrectAnswer 
                    ? "opacity-50 grayscale cursor-default" 
                    : ""
                }
                ${
                  isWrong 
                    ? "scale-95 cursor-not-allowed border-transparent bg-slate-100 opacity-50 shadow-none grayscale" 
                    : ""
                }
                ${
                  isCorrect 
                    ? "z-10 scale-105 border-green-500 bg-green-50 ring-4 ring-green-400 ring-offset-4 ring-offset-transparent shadow-green-200" 
                    : ""
                } 
              `}
            >
              <div className="pointer-events-none absolute inset-3 flex items-center justify-center overflow-hidden rounded-2xl bg-slate-50/50 sm:inset-5 sm:rounded-3xl">
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
