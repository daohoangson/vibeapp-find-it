"use client";

import Link from "next/link";
import { RefreshCw, Home, PartyPopper, Star } from "lucide-react";
import { Confetti } from "./Confetti";

interface SessionSummaryProps {
  topicId: string;
  topicName: string;
  topicIcon: string;
  correctCount: number;
  totalRounds: number;
}

export function SessionSummary({
  topicId,
  topicName,
  topicIcon,
  correctCount,
  totalRounds,
}: SessionSummaryProps) {
  const percentage = Math.round((correctCount / totalRounds) * 100);
  const isPerfect = correctCount === totalRounds;
  
  // Calculate stars
  let stars = 1;
  if (percentage > 90) stars = 3;
  else if (percentage > 60) stars = 2;

  return (
    <main className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-sky-100 via-blue-50 to-emerald-50 p-6">
      <Confetti />

      {/* Background decoration */}
      <div className="pointer-events-none absolute top-0 left-0 h-full w-full overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-64 w-64 animate-pulse rounded-full bg-yellow-300 opacity-20 blur-3xl" />
        <div
          className="absolute right-1/4 bottom-1/4 h-64 w-64 animate-pulse rounded-full bg-sky-300 opacity-20 blur-3xl"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <section className="z-10 flex max-h-full w-full max-w-lg flex-col items-center overflow-y-auto pb-12">
        <div className="mb-4 flex items-center gap-2 rounded-full bg-white/60 px-6 py-2 shadow-sm backdrop-blur-md">
          <PartyPopper className="h-5 w-5 text-amber-500" />
          <span className="text-sm font-bold tracking-widest text-slate-600 uppercase">
            Session Complete!
          </span>
        </div>

        <h1 className="animate-bounce-gentle mb-2 shrink-0 bg-gradient-to-r from-sky-600 via-blue-500 to-emerald-500 bg-clip-text text-center text-5xl font-black text-transparent drop-shadow-sm sm:mb-4 sm:text-6xl">
          {isPerfect ? "Perfect!" : percentage > 60 ? "Great Job!" : "Good Try!"}
        </h1>

        {/* Topic info */}
        <div className="mb-8 flex items-center gap-3 text-slate-700">
          <span className="text-4xl filter drop-shadow-md">{topicIcon}</span>
          <span className="text-2xl font-black">{topicName}</span>
        </div>

        {/* Score display */}
        <div className="relative mb-10 w-full max-w-xs rounded-3xl bg-white p-8 text-center shadow-xl shadow-sky-100 ring-4 ring-white/50">
           {/* Stars */}
           <div className="absolute -top-6 left-1/2 flex -translate-x-1/2 gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`flex h-12 w-12 items-center justify-center rounded-full border-4 border-white shadow-md transition-all duration-500 ${
                  i <= stars ? "bg-amber-400 scale-110" : "bg-slate-200"
                }`}
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                <Star
                  className={`h-6 w-6 ${
                    i <= stars ? "fill-white text-white" : "text-slate-400"
                  }`}
                />
              </div>
            ))}
          </div>

          <div className="mt-4 mb-2 text-7xl font-black text-sky-600 sm:text-8xl tracking-tight">
            {correctCount}
            <span className="text-3xl text-slate-300 font-bold ml-1">/{totalRounds}</span>
          </div>
          <div className="text-lg font-bold text-slate-400 uppercase tracking-widest">
            Correct
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex w-full flex-col gap-4 px-4 sm:flex-row sm:px-0">
          <Link
            href={`/topics/${topicId}/play`}
            prefetch={true}
            className="group flex flex-1 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-500 px-6 py-4 text-lg font-black text-white shadow-xl shadow-sky-500/30 transition-all hover:-translate-y-1 hover:scale-105 hover:shadow-2xl hover:shadow-sky-500/40 focus:ring-4 focus:ring-sky-500/30 focus:outline-none active:translate-y-1 active:scale-95"
          >
            <RefreshCw className="h-6 w-6 transition-transform group-hover:rotate-180" />
            Play Again
          </Link>

          <Link
            href="/topics"
            prefetch={true}
            className="group flex flex-1 items-center justify-center gap-3 rounded-2xl bg-white px-6 py-4 text-lg font-black text-slate-700 shadow-lg ring-1 ring-slate-200 transition-all hover:-translate-y-1 hover:scale-105 hover:shadow-xl focus:ring-4 focus:ring-slate-500/30 focus:outline-none active:translate-y-1 active:scale-95"
          >
            <Home className="h-6 w-6" />
            All Topics
          </Link>
        </div>
      </section>
    </main>
  );
}