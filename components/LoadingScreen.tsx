"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

const LOADING_PHRASES = [
  "Looking for it...",
  "Getting ready...",
  "Let's see...",
  "Almost there...",
  "Here we go...",
];

export function LoadingScreen() {
  const [phrase] = useState(
    () => LOADING_PHRASES[Math.floor(Math.random() * LOADING_PHRASES.length)],
  );

  return (
    <main
      className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-sky-100 via-blue-50 to-emerald-50"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="relative mb-8">
        <div className="absolute inset-0 animate-ping rounded-full bg-sky-400 opacity-20 duration-1000" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-xl">
          <Sparkles className="h-10 w-10 animate-bounce text-sky-500" />
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <h2 className="animate-pulse text-3xl font-black tracking-tight text-slate-800">
          {phrase}
        </h2>
        <div className="flex gap-2">
          <div className="h-3 w-3 animate-bounce rounded-full bg-sky-500 [animation-delay:-0.3s]" />
          <div className="h-3 w-3 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.15s]" />
          <div className="h-3 w-3 animate-bounce rounded-full bg-emerald-500" />
        </div>
      </div>
    </main>
  );
}
