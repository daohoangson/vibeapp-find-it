"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, Search } from "lucide-react";
import { unlockAudio, playPopSound } from "@/lib/audio";

interface InputScreenProps {
  inputWord: string;
  errorMsg: string;
  isLoading: boolean;
  suggestions: string[];
  onInputChange: (value: string) => void;
  onStart: () => void;
}

export function InputScreen({
  inputWord,
  errorMsg,
  isLoading,
  suggestions,
  onInputChange,
  onStart,
}: InputScreenProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && inputWord.trim() && !isLoading) {
      playPopSound();
      onStart();
    }
  };

  const handleStart = () => {
    playPopSound();
    onStart();
  };

  return (
    <main className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-sky-100 via-blue-50 to-emerald-50 p-6">
      {/* Background decoration */}
      <div className="animate-bounce-gentle absolute top-10 left-10 h-32 w-32 rounded-full bg-sky-300 opacity-20 blur-3xl" />
      <div
        className="animate-bounce-gentle absolute right-10 bottom-10 h-40 w-40 rounded-full bg-emerald-300 opacity-20 blur-3xl"
        style={{ animationDelay: "1s" }}
      />

      <section className="relative z-10 w-full max-w-lg rounded-[2.5rem] border-b-8 border-sky-200/50 bg-white/80 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
        <div className="mb-8 flex justify-center">
          <div className="relative rotate-3 rounded-3xl bg-gradient-to-br from-sky-500 to-blue-500 p-5 shadow-lg shadow-sky-500/30 transition-transform hover:rotate-0">
            <Sparkles className="h-14 w-14 text-white" />
            <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full border-4 border-white bg-amber-400" />
          </div>
        </div>

        <div className="mb-8 text-center">
          <h1 className="mb-3 text-5xl font-black tracking-tight text-slate-800 drop-shadow-sm">
            3moji
          </h1>
          <p className="text-lg font-medium text-slate-500">
            What should we look for today?
          </p>
        </div>

        {/* Quick suggestions */}
        <div className="mb-8 flex flex-wrap justify-center gap-3">
          {suggestions.map((word, i) => (
            <Link
              key={word}
              href={`/find/${encodeURIComponent(word)}`}
              prefetch={true}
              onClick={() => {
                unlockAudio();
                playPopSound();
              }}
              className={`group relative touch-manipulation overflow-hidden rounded-2xl px-5 py-2.5 text-sm font-bold transition-all hover:-translate-y-1 hover:shadow-md active:translate-y-0 ${
                isLoading ? "pointer-events-none opacity-50" : ""
              } ${
                i % 3 === 0
                  ? "bg-sky-100 text-sky-700 hover:bg-sky-200"
                  : i % 3 === 1
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    : "bg-amber-100 text-amber-700 hover:bg-amber-200"
              } `}
            >
              {word}
            </Link>
          ))}
        </div>

        <div className="space-y-4">
          <div className="group relative">
            <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center pl-1">
              <Search className="h-6 w-6 text-slate-400 transition-colors group-focus-within:text-sky-500" />
            </div>
            <input
              type="text"
              value={inputWord}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a word..."
              className="w-full rounded-2xl border-4 border-slate-100 bg-slate-50 py-5 pr-4 pl-14 text-2xl font-bold text-slate-800 placeholder-slate-300 transition-all select-text hover:border-sky-200 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/20 focus:outline-none"
              autoFocus
              disabled={isLoading}
            />
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="animate-in fade-in slide-in-from-top-2 rounded-2xl border border-red-100 bg-red-50 p-4 text-center text-sm font-bold text-red-500"
            >
              🙈 {errorMsg}
            </div>
          )}

          <button
            onClick={handleStart}
            disabled={!inputWord.trim() || isLoading}
            className="group relative flex w-full cursor-pointer touch-manipulation items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 py-5 text-xl font-black text-white shadow-xl shadow-sky-500/30 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-sky-500/40 focus:ring-4 focus:ring-sky-500/30 focus:outline-none active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            <span className="drop-shadow-md">Let&apos;s Play!</span>
            <ArrowRight className="h-7 w-7 stroke-[3px] transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </section>

      <div className="fixed bottom-6 text-xs font-semibold tracking-widest text-slate-400 uppercase opacity-50">
        Educational Game for Kids
      </div>
    </main>
  );
}
