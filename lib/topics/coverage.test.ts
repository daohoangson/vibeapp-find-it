import { describe, it, expect } from "vitest";
import { generateLocalContent } from "../game-content";
import { getAllTopics } from "./index";
import { generateTopicSession, DEFAULT_SESSION_LENGTH } from "./session";

describe("topic word coverage", () => {
  const topics = getAllTopics();

  it.each(topics.map((t) => [t.id, t]))(
    "topic %s has all words in emoji database",
    (_, topic) => {
      const failed: string[] = [];
      for (const word of topic.words) {
        if (!generateLocalContent(word)) {
          failed.push(word);
        }
      }
      expect(failed, `Missing words: ${failed.join(", ")}`).toHaveLength(0);
    },
  );

  it.each(topics.map((t) => [t.id, t]))(
    "topic %s has at least %i words for full session",
    (_, topic) => {
      expect(topic.words.length).toBeGreaterThanOrEqual(DEFAULT_SESSION_LENGTH);
    },
  );

  it.each(topics.map((t) => [t.id, t]))(
    "topic %s generates full session",
    (_, topic) => {
      const session = generateTopicSession(topic.id);
      expect(session).not.toBeNull();
      expect(session!.length).toBe(DEFAULT_SESSION_LENGTH);
    },
  );
});
