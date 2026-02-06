import { describe, it, expect } from "vitest";
import {
  getAllTopics,
  getTopicById,
  getTopicsByLevel,
  getRandomWordsFromTopic,
  TOPICS,
} from "./index";

describe("topics utilities", () => {
  describe("getAllTopics", () => {
    it("returns all topics", () => {
      const topics = getAllTopics();
      expect(topics).toEqual(TOPICS);
      expect(topics.length).toBeGreaterThan(0);
    });
  });

  describe("getTopicById", () => {
    it("returns topic by id", () => {
      const topic = getTopicById("animal-friends");
      expect(topic).toBeDefined();
      expect(topic?.name).toBe("Animal Friends");
    });

    it("returns undefined for unknown id", () => {
      const topic = getTopicById("unknown-topic");
      expect(topic).toBeUndefined();
    });
  });

  describe("getTopicsByLevel", () => {
    it("returns level 1 topics", () => {
      const topics = getTopicsByLevel(1);
      expect(topics.length).toBeGreaterThan(0);
      topics.forEach((topic) => {
        expect(topic.level).toBe(1);
      });
    });

    it("returns level 2 topics", () => {
      const topics = getTopicsByLevel(2);
      expect(topics.length).toBeGreaterThan(0);
      topics.forEach((topic) => {
        expect(topic.level).toBe(2);
      });
    });

    it("returns level 3 topics", () => {
      const topics = getTopicsByLevel(3);
      expect(topics.length).toBeGreaterThan(0);
      topics.forEach((topic) => {
        expect(topic.level).toBe(3);
      });
    });
  });

  describe("getRandomWordsFromTopic", () => {
    it("returns requested number of words", () => {
      const words = getRandomWordsFromTopic("animal-friends", 5);
      expect(words.length).toBe(5);
    });

    it("returns all words if count exceeds available", () => {
      const topic = getTopicById("animal-friends");
      const words = getRandomWordsFromTopic("animal-friends", 100);
      expect(words.length).toBe(topic?.words.length);
    });

    it("returns empty array for unknown topic", () => {
      const words = getRandomWordsFromTopic("unknown", 5);
      expect(words).toEqual([]);
    });

    it("returns words from the topic word list", () => {
      const topic = getTopicById("animal-friends")!;
      const words = getRandomWordsFromTopic("animal-friends", 3);
      words.forEach((word) => {
        expect(topic.words).toContain(word);
      });
    });
  });
});
