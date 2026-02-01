import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TopicCard } from "@/components";
import { getTopicsByLevel, getLevelInfo, type TopicLevel } from "@/lib/topics";

export const metadata: Metadata = {
  title: "Learning Topics - Find It!",
  description:
    "Explore fun learning topics for kids. Choose from animals, colors, shapes, and more to help your child learn through play.",
  openGraph: {
    title: "Learning Topics - Find It!",
    description:
      "Explore fun learning topics for kids. Choose from animals, colors, shapes, and more.",
    type: "website",
  },
};

const LEVEL_ICONS: Record<TopicLevel, string> = {
  1: "🌱",
  2: "🌟",
  3: "🎓",
};

export default function TopicsPage() {
  const levels: TopicLevel[] = [1, 2, 3];

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-emerald-50">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 px-4 py-4 shadow-sm backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link
            href="/"
            prefetch={true}
            aria-label="Go back"
            className="rounded-full bg-white/80 p-3 text-slate-400 shadow-sm transition-all hover:scale-105 hover:bg-white hover:text-sky-600 hover:shadow-md focus:ring-2 focus:ring-sky-500 focus:outline-none active:scale-95"
          >
            <ArrowLeft className="h-6 w-6 stroke-[3px]" />
          </Link>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 sm:text-3xl">
            Choose a Topic
          </h1>
          <div className="w-12" />
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {levels.map((level) => {
          const levelInfo = getLevelInfo(level);
          const topics = getTopicsByLevel(level);

          return (
            <section key={level} className="mb-12 last:mb-0">
              {/* Level Header */}
              <div className="mb-6 flex items-center gap-3">
                <span className="text-3xl">{LEVEL_ICONS[level]}</span>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 sm:text-2xl">
                    {levelInfo.name}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {levelInfo.ageRange} · {levelInfo.focus}
                  </p>
                </div>
              </div>

              {/* Topic Cards Grid */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {topics.map((topic) => (
                  <TopicCard key={topic.id} topic={topic} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
