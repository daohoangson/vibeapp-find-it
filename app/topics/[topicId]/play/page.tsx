import { notFound } from "next/navigation";
import { getAllTopics, getTopicById } from "@/lib/topics";
import {
  generateTopicSession,
  type RoundWithItems,
} from "@/lib/topics/session";
import TopicSession from "./session";

interface PageProps {
  params: Promise<{ topicId: string }>;
}

export async function generateStaticParams() {
  const topics = getAllTopics();
  return topics.map((topic) => ({
    topicId: topic.id,
  }));
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
