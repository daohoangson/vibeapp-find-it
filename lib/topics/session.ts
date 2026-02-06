import { z } from "zod";
import { getTopicById, getRandomWordsFromTopic } from "./index";
import { generateLocalContent } from "../game-content";
import { shuffle } from "../shuffle";

export const SessionRoundSchema = z.object({
  word: z.string(),
  type: z.enum(["color", "emoji"]),
  targetValue: z.string(),
  distractors: z.tuple([z.string(), z.string()]),
});

export type SessionRound = z.infer<typeof SessionRoundSchema>;

export const SessionSchema = z.object({
  topicId: z.string(),
  rounds: z.array(SessionRoundSchema),
  currentRound: z.number(),
  correctCount: z.number(),
});

export type Session = z.infer<typeof SessionSchema>;

export interface RoundWithItems extends SessionRound {
  items: { id: string; value: string; isCorrect: boolean }[];
}

export const DEFAULT_SESSION_LENGTH = 10;

export function generateTopicSession(
  topicId: string,
  sessionLength: number = DEFAULT_SESSION_LENGTH,
): RoundWithItems[] | null {
  const topic = getTopicById(topicId);
  if (!topic) {
    return null;
  }

  const words = getRandomWordsFromTopic(topicId, sessionLength);
  const rounds: RoundWithItems[] = [];

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

  return rounds.length > 0 ? rounds : null;
}
