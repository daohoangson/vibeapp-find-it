import { describe, it, expect } from "vitest";
import { generateLocalContent, fixVisuallySimilarEmojis } from "./game-content";
import { areVisuallySimilar } from "./emoji-data";

describe("generateLocalContent", () => {
  describe("color handling", () => {
    it("should generate content for basic colors", () => {
      const result = generateLocalContent("red");

      expect(result).not.toBeNull();
      expect(result?.type).toBe("color");
      expect(result?.targetValue).toBe("red");
      expect(result?.distractors).toHaveLength(2);
    });

    it("should normalize color input (case insensitive)", () => {
      expect(generateLocalContent("RED")?.targetValue).toBe("red");
      expect(generateLocalContent("Red")?.targetValue).toBe("red");
      expect(generateLocalContent("  red  ")?.targetValue).toBe("red");
    });

    it("should handle color aliases (grey -> gray)", () => {
      const result = generateLocalContent("grey");

      expect(result?.targetValue).toBe("gray");
    });

    it("should handle Spanish colors", () => {
      expect(generateLocalContent("rojo")?.targetValue).toBe("red");
      expect(generateLocalContent("azul")?.targetValue).toBe("blue");
      expect(generateLocalContent("verde")?.targetValue).toBe("green");
    });

    it("should handle French colors", () => {
      expect(generateLocalContent("rouge")?.targetValue).toBe("red");
      expect(generateLocalContent("bleu")?.targetValue).toBe("blue");
      expect(generateLocalContent("vert")?.targetValue).toBe("green");
    });

    it("should handle German colors", () => {
      expect(generateLocalContent("rot")?.targetValue).toBe("red");
      expect(generateLocalContent("blau")?.targetValue).toBe("blue");
      expect(generateLocalContent("grün")?.targetValue).toBe("green");
    });

    it("should return visually distinct color distractors", () => {
      const result = generateLocalContent("red");

      // Distractors should not include similar colors
      expect(result?.distractors).not.toContain("red");
      expect(result?.distractors).not.toContain("orange"); // too similar to red
      expect(result?.distractors).not.toContain("pink"); // too similar to red
    });
  });

  describe("emoji handling", () => {
    it("should generate content for known emoji names", () => {
      // "dog" maps to 🐕 (dog), not 🐶 (dog face) in the database
      const result = generateLocalContent("dog");

      expect(result).not.toBeNull();
      expect(result?.type).toBe("emoji");
      expect(result?.targetValue).toBe("🐕");
      expect(result?.distractors).toHaveLength(2);
    });

    it("should be case insensitive for emoji names", () => {
      expect(generateLocalContent("DOG")?.targetValue).toBe("🐕");
      expect(generateLocalContent("Dog")?.targetValue).toBe("🐕");
    });

    it("should return non-similar distractors", () => {
      const result = generateLocalContent("rose");

      expect(result).not.toBeNull();
      // Distractors should not be visually similar to target
      for (const distractor of result?.distractors || []) {
        expect(areVisuallySimilar(result!.targetValue, distractor)).toBe(false);
      }
    });

    it("should return null for unknown words", () => {
      expect(generateLocalContent("xyznonexistent")).toBeNull();
      expect(generateLocalContent("asdfghjkl")).toBeNull();
    });
  });
});

describe("fixVisuallySimilarEmojis", () => {
  it("should not modify color content", () => {
    const content = {
      type: "color" as const,
      targetValue: "red",
      distractors: ["blue", "green"] as [string, string],
    };

    const result = fixVisuallySimilarEmojis(content);

    expect(result).toEqual(content);
  });

  it("should not modify content if no similarity issues", () => {
    // Use animals that don't share keywords
    // 🦁 lion: ["lion", "strong"]
    // 🐯 tiger: ["big", "predator", "tiger"]
    // 🐻 bear: ["bear", "honey"]
    const content = {
      type: "emoji" as const,
      targetValue: "🦁",
      distractors: ["🐯", "🐻"] as [string, string],
    };

    const result = fixVisuallySimilarEmojis(content);

    expect(result.targetValue).toBe("🦁");
    expect(result.distractors).toContain("🐯");
    expect(result.distractors).toContain("🐻");
  });

  it("should fix when distractor is similar to target (flowers case)", () => {
    // This is the "bông hoa" case
    const content = {
      type: "emoji" as const,
      targetValue: "🌸", // cherry blossom
      distractors: ["🌹", "🌷"] as [string, string], // rose, tulip - all flowers
    };

    const result = fixVisuallySimilarEmojis(content);

    expect(result.targetValue).toBe("🌸");
    // Distractors should now be non-similar
    for (const distractor of result.distractors) {
      expect(areVisuallySimilar("🌸", distractor)).toBe(false);
    }
  });

  it("should fix when distractors are similar to each other", () => {
    const content = {
      type: "emoji" as const,
      targetValue: "🐶", // dog - not similar to flowers
      distractors: ["🌸", "🌹"] as [string, string], // both are flowers
    };

    const result = fixVisuallySimilarEmojis(content);

    // Should fix the similar distractors
    expect(result.targetValue).toBe("🐶");
    expect(result.distractors).toHaveLength(2);
  });

  it("should handle hearts similarity", () => {
    const content = {
      type: "emoji" as const,
      targetValue: "💘", // heart with arrow
      distractors: ["💝", "💖"] as [string, string], // similar hearts
    };

    const result = fixVisuallySimilarEmojis(content);

    // Distractors should be replaced with non-similar emojis
    for (const distractor of result.distractors) {
      expect(areVisuallySimilar("💘", distractor)).toBe(false);
    }
  });

  it("should fix when distractors share keywords with each other", () => {
    // 🫣 and 🫥 both have "hide" keyword - they are similar to each other
    const content = {
      type: "emoji" as const,
      targetValue: "🫠", // melting face
      distractors: ["🫣", "🫥"] as [string, string],
    };

    const result = fixVisuallySimilarEmojis(content);

    expect(result.targetValue).toBe("🫠");
    // Distractors should be replaced since they share "hide" keyword
    expect(result.distractors).toHaveLength(2);
    expect(areVisuallySimilar(result.distractors[0], result.distractors[1])).toBe(false);
  });

  it("should preserve targetValue when fixing", () => {
    const content = {
      type: "emoji" as const,
      targetValue: "🌹",
      distractors: ["🌸", "🌷"] as [string, string],
    };

    const result = fixVisuallySimilarEmojis(content);

    expect(result.targetValue).toBe("🌹");
    expect(result.type).toBe("emoji");
  });
});
