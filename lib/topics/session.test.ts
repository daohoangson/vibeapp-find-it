import { describe, it, expect } from "vitest";
import { generateTopicSession, DEFAULT_SESSION_LENGTH } from "./session";

describe("session utilities", () => {
  describe("generateTopicSession", () => {
    it("generates rounds for a valid topic", () => {
      const rounds = generateTopicSession("colors");
      expect(rounds).not.toBeNull();
      expect(rounds!.length).toBeGreaterThan(0);
    });

    it("returns null for invalid topic", () => {
      const rounds = generateTopicSession("invalid-topic");
      expect(rounds).toBeNull();
    });

    it("generates requested number of rounds", () => {
      const rounds = generateTopicSession("colors", 5);
      expect(rounds).not.toBeNull();
      expect(rounds!.length).toBe(5);
    });

    it("uses default session length when not specified", () => {
      const rounds = generateTopicSession("colors");
      expect(rounds).not.toBeNull();
      expect(rounds!.length).toBe(DEFAULT_SESSION_LENGTH);
    });

    it("each round has required properties", () => {
      const rounds = generateTopicSession("colors", 3);
      expect(rounds).not.toBeNull();

      for (const round of rounds!) {
        expect(round.word).toBeDefined();
        expect(round.type).toMatch(/^(color|emoji)$/);
        expect(round.targetValue).toBeDefined();
        expect(round.distractors).toHaveLength(2);
        expect(round.items).toHaveLength(3);
      }
    });

    it("items include exactly one correct answer", () => {
      const rounds = generateTopicSession("animal-friends", 3);
      expect(rounds).not.toBeNull();

      for (const round of rounds!) {
        const correctItems = round.items.filter((item) => item.isCorrect);
        expect(correctItems).toHaveLength(1);
        expect(correctItems[0].value).toBe(round.targetValue);
      }
    });
  });
});
