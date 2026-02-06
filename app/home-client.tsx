"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, ArrowRight, Search, ChevronRight } from "lucide-react";
import { TopicCard, PageHeader } from "@/components";
import { unlockAudio, playPopSound } from "@/lib/audio";
import type { Topic } from "@/lib/topics";

interface HomeClientProps {
  suggestions: string[];
  featuredTopics: Topic[];
}

export default function HomeClient({
  suggestions,
  featuredTopics,
}: HomeClientProps) {
  const router = useRouter();
  const [inputWord, setInputWord] = useState("");

  const handleStart = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputWord.trim()) return;
    playPopSound();
    await unlockAudio();
    router.push(`/find/${encodeURIComponent(inputWord.trim())}`);
  };

  return (
    <main className="relative min-h-screen overflow-y-auto bg-gradient-to-br from-sky-100 via-blue-50 to-emerald-50 text-slate-900">
      <PageHeader
        sticky={false}
        showBackground={false}
        className="absolute top-0 right-0 left-0"
      />

      {/* Background decoration */}
      <div className="animate-bounce-gentle fixed top-10 left-10 h-32 w-32 rounded-full bg-sky-300 opacity-20 blur-3xl" />
      <div
        className="animate-bounce-gentle fixed right-10 bottom-10 h-40 w-40 rounded-full bg-emerald-300 opacity-20 blur-3xl"
        style={{ animationDelay: "1s" }}
      />

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Header */}
        <header className="mb-8 text-center sm:mb-12">
          <div className="mb-4 flex justify-center">
            <div className="relative rotate-3 rounded-3xl bg-gradient-to-br from-sky-500 to-blue-500 p-4 shadow-lg shadow-sky-500/30 transition-transform hover:rotate-0 sm:p-5">
              <Sparkles className="h-10 w-10 text-white sm:h-14 sm:w-14" />
              <div className="absolute -top-2 -right-2 h-5 w-5 rounded-full border-4 border-white bg-amber-400 sm:h-6 sm:w-6" />
            </div>
          </div>
          <h1 className="mb-2 text-4xl font-black tracking-tight text-slate-800 drop-shadow-sm sm:text-5xl">
            Find It!
          </h1>
          <p className="text-base font-medium text-slate-500 sm:text-lg">
            A fun learning game for kids
          </p>
        </header>

        {/* Featured Topics Section */}
        <section className="mb-8 sm:mb-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 sm:text-2xl">
              Choose a Topic
            </h2>
            <Link
              href="/topics"
              prefetch={true}
              onClick={() => playPopSound()}
              className="flex touch-manipulation items-center gap-1 text-sm font-bold text-sky-600 transition-colors hover:text-sky-700"
            >
              See All
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 sm:gap-4">
            {featuredTopics.map((topic) => (
              <TopicCard key={topic.id} topic={topic} variant="compact" />
            ))}
          </div>
        </section>

        {/* Custom Word Input Section */}
        <section className="rounded-[2rem] border-b-8 border-sky-200/50 bg-white/80 p-6 shadow-xl backdrop-blur-xl sm:rounded-[2.5rem] sm:p-8">
          <h2 className="mb-4 text-center text-lg font-bold text-slate-700 sm:text-xl">
            Or type any word
          </h2>

          {/* Quick suggestions */}
          <div className="mb-6 flex flex-wrap justify-center gap-2 sm:gap-3">
            {suggestions.map((word, i) => (
              <Link
                key={word}
                href={`/find/${encodeURIComponent(word)}`}
                prefetch={true}
                onClick={() => {
                  playPopSound();
                  unlockAudio();
                }}
                className={`touch-manipulation rounded-2xl px-4 py-2 text-sm font-bold transition-all hover:-translate-y-1 hover:shadow-md active:translate-y-0 ${
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

          <form onSubmit={handleStart} className="space-y-4">
            <div className="group relative">
              <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center pl-1">
                <Search className="h-5 w-5 text-slate-400 transition-colors group-focus-within:text-sky-500 sm:h-6 sm:w-6" />
              </div>
              <input
                type="text"
                value={inputWord}
                onChange={(e) => setInputWord(e.target.value)}
                placeholder="Type a word..."
                className="w-full rounded-2xl border-4 border-slate-100 bg-slate-50 py-4 pr-4 pl-12 text-lg font-bold text-slate-800 placeholder-slate-300 transition-all hover:border-sky-200 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/20 focus:outline-none sm:rounded-2xl sm:py-5 sm:pl-14 sm:text-2xl"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={!inputWord.trim()}
              className="group relative flex w-full touch-manipulation items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 py-4 text-lg font-black text-white shadow-xl shadow-sky-500/30 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-sky-500/40 focus:ring-4 focus:ring-sky-500/30 focus:outline-none active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none sm:rounded-2xl sm:py-5 sm:text-xl"
            >
              <span className="drop-shadow-md">Let&apos;s Play!</span>
              <ArrowRight className="h-6 w-6 stroke-[3px] transition-transform group-hover:translate-x-1 sm:h-7 sm:w-7" />
            </button>
          </form>
        </section>

        <footer className="mt-8 text-center text-xs font-semibold tracking-widest text-slate-400 uppercase opacity-50">
          Educational Game for Kids
        </footer>
      </div>
    </main>
  );
}
