import { TOPICS } from "./data";
import { shuffle } from "../shuffle";
import type { Topic, TopicLevel } from "./schema";

export { TOPICS } from "./data";
export { LEVELS, getLevelInfo } from "./levels";
export type { Topic, TopicLevel } from "./schema";
export type { LevelInfo } from "./levels";

export function getAllTopics(): Topic[] {
  return TOPICS;
}

export function getTopicById(id: string): Topic | undefined {
  return TOPICS.find((topic) => topic.id === id);
}

export function getTopicsByLevel(level: TopicLevel): Topic[] {
  return TOPICS.filter((topic) => topic.level === level);
}

export function getRandomWordsFromTopic(
  topicId: string,
  count: number,
): string[] {
  const topic = getTopicById(topicId);
  if (!topic) {
    return [];
  }
  const shuffled = shuffle([...topic.words]);
  return shuffled.slice(0, Math.min(count, topic.words.length));
}
