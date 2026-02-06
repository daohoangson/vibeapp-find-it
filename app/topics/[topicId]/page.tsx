import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Play, Target, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components";
import { getAllTopics, getTopicById, getLevelInfo } from "@/lib/topics";

interface PageProps {
  params: Promise<{ topicId: string }>;
}

export async function generateStaticParams() {
  const topics = getAllTopics();
  return topics.map((topic) => ({
    topicId: topic.id,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { topicId } = await params;
  const topic = getTopicById(topicId);

  if (!topic) {
    return {
      title: "Topic Not Found - Find It!",
    };
  }

  const levelInfo = getLevelInfo(topic.level);

  return {
    title: `Learn ${topic.name} - Find It!`,
    description: topic.description,
    openGraph: {
      title: `Learn ${topic.name} - Find It!`,
      description: topic.description,
      type: "website",
    },
    other: {
      "age-range": levelInfo.ageRange,
    },
  };
}

export default async function TopicDetailPage({ params }: PageProps) {
  const { topicId } = await params;
  const topic = getTopicById(topicId);

  if (!topic) {
    notFound();
  }

  const levelInfo = getLevelInfo(topic.level);

  // Show a sample of words (up to 8)
  const sampleWords = topic.words.slice(0, 8);

  // JSON-LD structured data for educational content
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: `Learn ${topic.name} - Find It!`,
    description: topic.description,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    audience: {
      "@type": "EducationalAudience",
      educationalRole: "student",
      suggestedAge: levelInfo.ageRange,
    },
    learningResourceType: "Interactive game",
    teaches: topic.learningGoals,
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-gradient-to-br from-sky-100 via-blue-50 to-emerald-50 pb-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Background decoration */}
      <div className="fixed -top-20 -left-20 h-64 w-64 animate-pulse rounded-full bg-sky-300 opacity-20 blur-3xl" />
      <div
        className="fixed top-40 -right-20 h-80 w-80 animate-pulse rounded-full bg-emerald-300 opacity-20 blur-3xl"
        style={{ animationDelay: "1s" }}
      />

      <PageHeader backHref="/topics" backLabel="Back to topics" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-4xl px-4 py-4 sm:px-6 sm:py-8">
        {/* Topic Header */}
        <div className="mb-8 text-center sm:mb-12">
          <div className="mb-6 inline-block rounded-[2rem] bg-white p-6 text-7xl shadow-xl ring-4 shadow-sky-100 ring-white transition-transform hover:scale-105 hover:rotate-3 sm:text-8xl">
            {topic.icon}
          </div>
          <h1 className="mb-3 text-3xl font-black text-slate-800 sm:text-5xl">
            {topic.name}
          </h1>
          <p className="mx-auto max-w-xl text-lg leading-relaxed text-slate-600">
            {topic.description}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Learning Goals */}
          <section className="rounded-3xl bg-white/80 p-6 shadow-xl backdrop-blur-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-sky-100 p-2 text-sky-600">
                <Target className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">
                What You&apos;ll Learn
              </h2>
            </div>
            <ul className="space-y-4">
              {topic.learningGoals.map((goal, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 text-slate-700"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                  <span className="font-medium">{goal}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Word Preview */}
          <section className="rounded-3xl bg-white/80 p-6 shadow-xl backdrop-blur-sm sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">
                Preview Words
              </h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold tracking-wider text-slate-500 uppercase">
                {topic.words.length} Total
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {sampleWords.map((word) => (
                <span
                  key={word}
                  className="cursor-default rounded-xl border border-sky-100 bg-gradient-to-br from-sky-50 to-blue-50 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition-transform select-none hover:scale-105 hover:shadow-md"
                >
                  {word}
                </span>
              ))}
              {topic.words.length > 8 && (
                <span className="flex items-center rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-400">
                  +{topic.words.length - 8} more
                </span>
              )}
            </div>
          </section>
        </div>

        {/* Start Playing Button */}
        <div className="mt-12 text-center">
          <Link
            href={`/topics/${topic.id}/play`}
            prefetch={true}
            className="group animate-pulse-slow relative inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-sky-500 via-blue-500 to-sky-600 bg-[length:200%_auto] px-12 py-6 text-2xl font-black text-white shadow-xl shadow-sky-500/30 transition-all hover:-translate-y-1 hover:scale-105 hover:bg-right hover:shadow-2xl hover:shadow-sky-500/40 focus:ring-4 focus:ring-sky-500/30 focus:outline-none active:translate-y-1 active:scale-95"
          >
            <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
            <Play className="h-8 w-8 fill-current" />
            Start Playing
          </Link>
          <p className="mt-4 text-sm font-bold tracking-widest text-slate-400 uppercase">
            No typing required!
          </p>
        </div>
      </div>
    </main>
  );
}
