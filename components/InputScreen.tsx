"use client";

import { Sparkles, ArrowRight, Search } from "lucide-react";

interface InputScreenProps {
  inputWord: string;
  errorMsg: string;
  isLoading: boolean;
  suggestions: string[];
  onInputChange: (value: string) => void;
  onStart: () => void;
  onSuggestionClick: (word: string) => void;
}

export function InputScreen({
  inputWord,
  errorMsg,
  isLoading,
  suggestions,
  onInputChange,
  onStart,
  onSuggestionClick,
}: InputScreenProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && inputWord.trim() && !isLoading) {
      onStart();
    }
  };

  return (
    <main className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-sky-100 via-blue-50 to-emerald-50 p-6">
      {/* Background decoration */}
      <div className="absolute top-10 left-10 h-32 w-32 rounded-full bg-sky-300 opacity-20 blur-3xl animate-bounce-gentle" />
      <div className="absolute bottom-10 right-10 h-40 w-40 rounded-full bg-emerald-300 opacity-20 blur-3xl animate-bounce-gentle" style={{ animationDelay: "1s" }} />

      <section className="relative z-10 w-full max-w-lg rounded-[2.5rem] border-b-8 border-sky-200/50 bg-white/80 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
        <div className="mb-8 flex justify-center">
          <div className="relative rounded-3xl bg-gradient-to-br from-sky-500 to-blue-500 p-5 shadow-lg shadow-sky-500/30 rotate-3 transition-transform hover:rotate-0">
            <Sparkles className="h-14 w-14 text-white" />
            <div className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-amber-400 border-4 border-white" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="mb-3 text-5xl font-black tracking-tight text-slate-800 drop-shadow-sm">
            Find It!
          </h1>
          <p className="text-lg font-medium text-slate-500">
            What should we look for today?
          </p>
        </div>

        {/* Quick suggestions */}
        <div className="mb-8 flex flex-wrap justify-center gap-3">
          {suggestions.map((word, i) => (
            <button
              key={word}
              onClick={() => onSuggestionClick(word)}
              disabled={isLoading}
              className={`group relative overflow-hidden rounded-2xl px-5 py-2.5 text-sm font-bold transition-all hover:-translate-y-1 hover:shadow-md active:translate-y-0 disabled:opacity-50
                ${
                  i % 3 === 0
                    ? "bg-sky-100 text-sky-700 hover:bg-sky-200"
                    : i % 3 === 1
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                      : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                }
              `}
            >
              {word}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div className="relative group">
            <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center pl-1">
              <Search className="h-6 w-6 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
            </div>
            <input
              type="text"
              value={inputWord}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a word..."
              className="w-full rounded-2xl border-4 border-slate-100 bg-slate-50 py-5 pl-14 pr-4 text-2xl font-bold text-slate-800 placeholder-slate-300 transition-all hover:border-sky-200 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/20 focus:outline-none"
              autoFocus
              disabled={isLoading}
            />
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="animate-in fade-in slide-in-from-top-2 rounded-2xl bg-red-50 p-4 text-center text-sm font-bold text-red-500 border border-red-100"
            >
              🙈 {errorMsg}
            </div>
          )}

          <button
            onClick={onStart}
            disabled={!inputWord.trim() || isLoading}
            className="group relative flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 py-5 text-xl font-black text-white shadow-xl shadow-sky-500/30 transition-all hover:shadow-2xl hover:shadow-sky-500/40 hover:scale-[1.02] focus:ring-4 focus:ring-sky-500/30 focus:outline-none active:scale-[0.98] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
          >
            <span className="drop-shadow-md">Let's Play!</span>
            <ArrowRight className="h-7 w-7 stroke-[3px] transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </section>
      
      <div className="fixed bottom-6 text-xs font-semibold text-slate-400 uppercase tracking-widest opacity-50">
        Educational Game for Kids
      </div>
    </main>
  );
}
