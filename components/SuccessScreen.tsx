"use client";

import { useState } from "react";
import Link from "next/link";
import { RefreshCw, PartyPopper } from "lucide-react";
import { Confetti } from "./Confetti";
import { playSuccessSound, playPopSound } from "@/lib/audio";

interface SuccessScreenProps {
  inputWord: string;
  targetValue: string;
  type: "color" | "emoji";
  suggestions: string[];
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
        className="h-full w-full rounded-2xl border-2 border-black/5 shadow-inner"
        style={{ backgroundColor: targetValue }}
        role="img"
        aria-label={`Color: ${targetValue}`}
      />
    );
  }

  return (
    <div
      className="flex h-full w-full items-center justify-center text-8xl leading-none drop-shadow-sm filter sm:text-9xl"
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
  suggestions,
}: SuccessScreenProps) {
  const [confettiKey, setConfettiKey] = useState(0);

  const handleTargetTap = () => {
    playSuccessSound();
    playPopSound();
    setConfettiKey((prev) => prev + 1);
  };

  return (
    <main className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-sky-100 via-blue-50 to-emerald-50 p-6">
      <Confetti key={confettiKey} />

      {/* Background decoration */}
      <div className="pointer-events-none absolute top-0 left-0 h-full w-full overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-64 w-64 animate-pulse rounded-full bg-yellow-300 opacity-20 blur-3xl" />
        <div
          className="absolute right-1/4 bottom-1/4 h-64 w-64 animate-pulse rounded-full bg-sky-300 opacity-20 blur-3xl"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <section className="z-10 flex max-h-full w-full max-w-lg flex-col items-center overflow-y-auto pb-12">
        <div className="mb-2 flex items-center gap-2 rounded-full bg-white/50 px-4 py-1 backdrop-blur-sm">
          <PartyPopper className="h-5 w-5 text-amber-500" />
          <span className="text-sm font-bold tracking-widest text-slate-500 uppercase">
            You did it!
          </span>
        </div>

        <h1 className="animate-bounce-gentle mb-2 shrink-0 bg-gradient-to-r from-sky-600 via-blue-500 to-emerald-500 bg-clip-text text-center text-5xl font-black text-transparent drop-shadow-sm sm:mb-4 sm:text-6xl">
          Amazing!
        </h1>
        <p className="mb-6 shrink-0 text-xl font-bold text-slate-600 sm:mb-8 sm:text-2xl">
          You found the{" "}
          <span className="text-sky-600 underline decoration-sky-300 decoration-wavy underline-offset-4">
            {inputWord}
          </span>
          !
        </p>

        <button
          onClick={handleTargetTap}
          className="mb-8 shrink-0 rotate-3 cursor-pointer touch-manipulation rounded-[2.5rem] border-b-[8px] border-slate-200 bg-white p-4 shadow-2xl transition-all duration-200 hover:scale-110 hover:rotate-0 hover:border-b-[12px] hover:shadow-sky-500/20 focus:ring-4 focus:ring-sky-500/30 focus:outline-none active:scale-95 active:border-b-4 sm:mb-10 sm:p-6"
          aria-label="Tap to celebrate again!"
        >
          <div className="flex h-32 w-32 items-center justify-center rounded-3xl border-4 border-slate-100 bg-slate-50 sm:h-52 sm:w-52">
            <TargetDisplay targetValue={targetValue} type={type} />
          </div>
        </button>

        {/* Quick play suggestions */}
        <p className="mb-4 text-sm font-bold tracking-widest text-slate-400 uppercase">
          Play next:
        </p>
        <div className="mb-8 flex shrink-0 flex-wrap justify-center gap-3">
          {suggestions.map((word, i) => (
            <Link
              key={word}
              href={`/find/${encodeURIComponent(word)}`}
              prefetch={true}
              onClick={() => playPopSound()}
              className={`touch-manipulation rounded-xl px-4 py-2 text-sm font-bold transition-all hover:-translate-y-1 hover:shadow-md active:translate-y-0 ${
                i % 2 === 0
                  ? "bg-white text-sky-600 shadow-sm ring-1 ring-sky-100 hover:bg-sky-50"
                  : "bg-white text-emerald-600 shadow-sm ring-1 ring-emerald-100 hover:bg-emerald-50"
              } `}
            >
              {word}
            </Link>
          ))}
        </div>

        <Link
          href="/"
          prefetch={true}
          onClick={() => playPopSound()}
          className="group flex shrink-0 touch-manipulation items-center gap-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-10 py-5 text-xl font-black text-white shadow-xl shadow-emerald-500/30 transition-all hover:-translate-y-1 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/40 focus:ring-4 focus:ring-emerald-500/30 focus:outline-none active:translate-y-1 active:scale-95 sm:text-2xl"
        >
          <RefreshCw className="h-7 w-7 transition-transform group-hover:rotate-180" />
          Play Again
        </Link>
      </section>
    </main>
  );
}
