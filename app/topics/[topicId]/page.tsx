import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Play, Target } from "lucide-react";
import { getAllTopics, getTopicById } from "@/lib/topics";

interface PageProps {
  params: Promise<{ topicId: string }>;
}

export async function generateStaticParams() {
  const topics = getAllTopics();
  return topics.map((topic) => ({
    topicId: topic.id,
  }));
}

export default async function TopicDetailPage({ params }: PageProps) {
  const { topicId } = await params;
  const topic = getTopicById(topicId);

  if (!topic) {
    notFound();
  }

  // Show a sample of words (up to 6)
  const sampleWords = topic.words.slice(0, 6);

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-emerald-50">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 px-4 py-4 shadow-sm backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            href="/topics"
            prefetch={true}
            aria-label="Back to topics"
            className="rounded-full bg-white/80 p-3 text-slate-400 shadow-sm transition-all hover:scale-105 hover:bg-white hover:text-sky-600 hover:shadow-md focus:ring-2 focus:ring-sky-500 focus:outline-none active:scale-95"
          >
            <ArrowLeft className="h-6 w-6 stroke-[3px]" />
          </Link>
          <div className="w-12" />
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Topic Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 text-7xl sm:text-8xl">{topic.icon}</div>
          <h1 className="mb-2 text-3xl font-black text-slate-800 sm:text-4xl">
            {topic.name}
          </h1>
          <p className="mx-auto max-w-xl text-slate-600">{topic.description}</p>
        </div>

        {/* Learning Goals */}
        <section className="mb-8 rounded-2xl bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-sky-500" />
            <h2 className="font-bold text-slate-800">Learning Goals</h2>
          </div>
          <ul className="space-y-2">
            {topic.learningGoals.map((goal, index) => (
              <li key={index} className="flex items-start gap-2 text-slate-600">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-sky-400" />
                {goal}
              </li>
            ))}
          </ul>
        </section>

        {/* Word Preview */}
        <section className="mb-8 rounded-2xl bg-white p-6 shadow-md">
          <h2 className="mb-4 font-bold text-slate-800">
            Words You&apos;ll Learn
          </h2>
          <div className="flex flex-wrap gap-2">
            {sampleWords.map((word) => (
              <span
                key={word}
                className="rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700"
              >
                {word}
              </span>
            ))}
            {topic.words.length > 6 && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-500">
                +{topic.words.length - 6} more
              </span>
            )}
          </div>
        </section>

        {/* Start Playing Button */}
        <div className="text-center">
          <Link
            href={`/topics/${topic.id}/play`}
            prefetch={true}
            className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-sky-500 to-blue-500 px-10 py-5 text-xl font-black text-white shadow-xl shadow-sky-500/30 transition-all hover:-translate-y-1 hover:scale-105 hover:shadow-2xl hover:shadow-sky-500/40 focus:ring-4 focus:ring-sky-500/30 focus:outline-none active:translate-y-1 active:scale-95 sm:text-2xl"
          >
            <Play className="h-7 w-7 fill-current" />
            Start Playing
          </Link>
        </div>
      </div>
    </main>
  );
}
