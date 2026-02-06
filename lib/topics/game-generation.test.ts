import { describe, it, expect, vi } from "vitest";

import { deterministicShuffle } from "../test-utils/deterministic-shuffle";

// Keep word order and distractor order deterministic for snapshot review.
vi.mock("../shuffle", () => ({
  shuffle: <T>(items: T[]) => deterministicShuffle(items),
}));

import { getAllTopics } from "./index";
import { generateTopicSession, DEFAULT_SESSION_LENGTH } from "./session";

function summarizeRounds(rounds: ReturnType<typeof generateTopicSession>) {
  if (!rounds) return [];
  return rounds.map((round) =>
    [
      `${round.word} -> ${round.targetValue}`,
      `distractors: ${round.distractors.join(", ")}`,
    ].join(" | "),
  );
}

describe("topic session generation (deterministic)", () => {
  const topics = getAllTopics();

  it.each(topics.map((topic) => [topic.id, topic]))(
    "generates a valid session for %s",
    (_, topic) => {
      const rounds = generateTopicSession(topic.id);
      expect(rounds).not.toBeNull();
      expect(rounds).toHaveLength(DEFAULT_SESSION_LENGTH);

      rounds!.forEach((round) => {
        expect(round.word).toBeTruthy();
        expect(round.type).toMatch(/^(color|emoji)$/);
        expect(round.targetValue).toBeTruthy();
        expect(round.distractors).toHaveLength(2);
        expect(new Set(round.distractors).size).toBe(2);
        expect(round.items).toHaveLength(3);

        const correctItems = round.items.filter((item) => item.isCorrect);
        expect(correctItems).toHaveLength(1);
        expect(correctItems[0].value).toBe(round.targetValue);

        const itemValues = round.items.map((item) => item.value);
        expect(itemValues).toContain(round.targetValue);
        round.distractors.forEach((distractor) =>
          expect(itemValues).toContain(distractor),
        );
      });
    },
  );

  it.each(topics.map((topic) => [topic.id, topic]))(
    "snapshot preview for %s",
    (_, topic) => {
      const rounds = generateTopicSession(topic.id);
      expect(rounds).not.toBeNull();
      expect(summarizeRounds(rounds)).toMatchSnapshot();
    },
  );
});
