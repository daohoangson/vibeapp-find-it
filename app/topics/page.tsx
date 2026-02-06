import type { Metadata } from "next";
import { TopicCard, PageHeader } from "@/components";
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
      <PageHeader backHref="/" title="Choose a Topic" />

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
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                {topics.map((topic) => (
                  <div
                    key={topic.id}
                    className="flex w-full max-w-[280px] min-w-[160px] flex-1 sm:w-64"
                  >
                    <TopicCard topic={topic} />
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
