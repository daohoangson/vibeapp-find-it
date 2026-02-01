import { notFound } from "next/navigation";
import { getTopicById } from "@/lib/topics";
import {
  generateTopicSession,
  type RoundWithItems,
} from "@/lib/topics/session";
import TopicSession from "./session";

// Force dynamic rendering so each play session gets fresh random words.
// Without this, Next.js may cache the first request (Full Route Cache)
// since generateTopicSession() is synchronous with no dynamic signals
// (no cookies/headers/searchParams), causing "Play Again" to serve stale rounds.
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ topicId: string }>;
}

export type RoundData = RoundWithItems;

export default async function TopicPlayPage({ params }: PageProps) {
  const { topicId } = await params;
  const topic = getTopicById(topicId);

  if (!topic) {
    notFound();
  }

  const rounds = generateTopicSession(topicId);

  if (!rounds) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-gradient-to-br from-sky-100 via-blue-50 to-emerald-50 text-slate-900">
        <p className="text-xl">Could not load game for this topic</p>
      </div>
    );
  }

  return (
    <TopicSession
      topicId={topicId}
      topicName={topic.name}
      topicIcon={topic.icon}
      rounds={rounds}
    />
  );
}
