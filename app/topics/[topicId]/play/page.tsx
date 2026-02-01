import { notFound } from "next/navigation";
import {
  getAllTopics,
  getTopicById,
  getRandomWordsFromTopic,
} from "@/lib/topics";
import { generateLocalContent } from "@/lib/game-content";
import { shuffle } from "@/lib/shuffle";
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

const SESSION_LENGTH = 10;

export interface RoundData {
  word: string;
  type: "color" | "emoji";
  targetValue: string;
  distractors: [string, string];
  items: { id: string; value: string; isCorrect: boolean }[];
}

export default async function TopicPlayPage({ params }: PageProps) {
  const { topicId } = await params;
  const topic = getTopicById(topicId);

  if (!topic) {
    notFound();
  }

  // Get random words and generate content for each
  const words = getRandomWordsFromTopic(topicId, SESSION_LENGTH);
  const rounds: RoundData[] = [];

  for (const word of words) {
    const content = generateLocalContent(word);
    if (content) {
      rounds.push({
        word,
        type: content.type,
        targetValue: content.targetValue,
        distractors: content.distractors as [string, string],
        items: shuffle([
          { id: `${word}-target`, value: content.targetValue, isCorrect: true },
          { id: `${word}-d1`, value: content.distractors[0], isCorrect: false },
          { id: `${word}-d2`, value: content.distractors[1], isCorrect: false },
        ]),
      });
    }
  }

  // If no rounds could be generated, show error
  if (rounds.length === 0) {
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
