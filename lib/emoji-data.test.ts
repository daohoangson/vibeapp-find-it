import { describe, it, expect } from "vitest";
import {
  areVisuallySimilar,
  getCategoryByEmoji,
  getDistractors,
  findEmojiByName,
  getEmojisByCategory,
  getShortestEmojiNames,
} from "./emoji-data";

describe("areVisuallySimilar", () => {
  it("should detect flowers as visually similar (share 'flower' name)", () => {
    // This is the "bông hoa" case - all flowers share the "flower" name
    expect(areVisuallySimilar("🌸", "🌹")).toBe(true); // cherry blossom vs rose
    expect(areVisuallySimilar("🌸", "🌷")).toBe(true); // cherry blossom vs tulip
    expect(areVisuallySimilar("🌹", "🌷")).toBe(true); // rose vs tulip
    expect(areVisuallySimilar("🌻", "🌼")).toBe(true); // sunflower vs blossom
  });

  it("should detect hearts as visually similar", () => {
    expect(areVisuallySimilar("💘", "💝")).toBe(true);
    expect(areVisuallySimilar("❤️", "💛")).toBe(false); // different - no shared name
    expect(areVisuallySimilar("💖", "💗")).toBe(true);
  });

  it("should detect cat faces as visually similar", () => {
    expect(areVisuallySimilar("🐱", "😺")).toBe(true); // both are "cat face"
    expect(areVisuallySimilar("😸", "😹")).toBe(true);
  });

  it("should NOT detect unrelated emojis as similar", () => {
    expect(areVisuallySimilar("🐶", "🌸")).toBe(false); // dog vs flower
    expect(areVisuallySimilar("🚗", "🍎")).toBe(false); // car vs apple
    expect(areVisuallySimilar("😀", "🏠")).toBe(false); // smile vs house
  });

  it("should NOT detect different animals as similar", () => {
    expect(areVisuallySimilar("🐶", "🐱")).toBe(false); // dog vs cat
    expect(areVisuallySimilar("🦁", "🐯")).toBe(false); // lion vs tiger
    expect(areVisuallySimilar("🐴", "🦓")).toBe(false); // horse vs zebra
  });

  it("should return false if emoji is not in database", () => {
    expect(areVisuallySimilar("🌸", "❓")).toBe(false);
    expect(areVisuallySimilar("❓", "🌸")).toBe(false);
  });

  it("should handle same emoji comparison", () => {
    expect(areVisuallySimilar("🌸", "🌸")).toBe(true);
    expect(areVisuallySimilar("🐶", "🐶")).toBe(true);
  });
});

describe("getCategoryByEmoji", () => {
  it("should return correct category for flowers", () => {
    expect(getCategoryByEmoji("🌸")).toBe("nature");
    expect(getCategoryByEmoji("🌹")).toBe("nature");
    expect(getCategoryByEmoji("🌷")).toBe("nature");
  });

  it("should return correct category for animals", () => {
    expect(getCategoryByEmoji("🐶")).toBe("animals");
    expect(getCategoryByEmoji("🐱")).toBe("animals");
  });

  it("should return correct category for food", () => {
    expect(getCategoryByEmoji("🍎")).toBe("fruits");
    expect(getCategoryByEmoji("🍕")).toBe("food");
  });

  it("should return null for unknown emoji", () => {
    expect(getCategoryByEmoji("🫠")).toBeNull(); // melting face - newer emoji
    expect(getCategoryByEmoji("unknown")).toBeNull();
  });
});

describe("getDistractors", () => {
  it("should return distractors that are NOT visually similar to target", () => {
    const distractors = getDistractors("🌸", "nature", 2);

    expect(distractors).toHaveLength(2);
    // None of the distractors should be visually similar to the target flower
    for (const distractor of distractors) {
      expect(areVisuallySimilar("🌸", distractor)).toBe(false);
    }
  });

  it("should not include the target emoji in distractors", () => {
    const distractors = getDistractors("🐶", "animals", 2);

    expect(distractors).not.toContain("🐶");
  });

  it("should return emojis from the same category", () => {
    const distractors = getDistractors("🍎", "fruits", 2);

    for (const distractor of distractors) {
      expect(getCategoryByEmoji(distractor)).toBe("fruits");
    }
  });

  it("should return fewer distractors if not enough valid ones available", () => {
    // Request more distractors than might be available
    const distractors = getDistractors("🌸", "nature", 100);

    // Should return whatever is available, all non-similar
    for (const distractor of distractors) {
      expect(areVisuallySimilar("🌸", distractor)).toBe(false);
    }
  });
});

describe("findEmojiByName", () => {
  it("should find emoji by primary name", () => {
    const result = findEmojiByName("dog");
    expect(result).not.toBeNull();
    expect(result?.emoji).toBe("🐶");
  });

  it("should find emoji by alias", () => {
    const result = findEmojiByName("puppy");
    expect(result).not.toBeNull();
    expect(result?.emoji).toBe("🐶");
  });

  it("should be case insensitive", () => {
    expect(findEmojiByName("DOG")?.emoji).toBe("🐶");
    expect(findEmojiByName("Dog")?.emoji).toBe("🐶");
    expect(findEmojiByName("dOg")?.emoji).toBe("🐶");
  });

  it("should return null for unknown name", () => {
    expect(findEmojiByName("xyznonexistent")).toBeNull();
  });

  it("should return category info", () => {
    const result = findEmojiByName("rose");
    expect(result?.category).toBe("nature");
  });
});

describe("getShortestEmojiNames", () => {
  it("should return shortest names for suggestions", () => {
    const names = getShortestEmojiNames();

    // Should include short names
    expect(names).toContain("dog"); // not "dog face"
    expect(names).toContain("flower"); // not "cherry blossom" for 🌸
  });

  it("should return many unique names", () => {
    const names = getShortestEmojiNames();
    expect(names.length).toBeGreaterThan(100);
  });

  it("should deduplicate names", () => {
    const names = getShortestEmojiNames();
    const uniqueNames = new Set(names);
    // All names should be unique (no duplicates)
    expect(names.length).toBe(uniqueNames.size);
  });
});

describe("getEmojisByCategory", () => {
  it("should return emojis in a category", () => {
    const nature = getEmojisByCategory("nature");
    expect(nature.length).toBeGreaterThan(0);

    // Should include flowers
    const emojis = nature.map((item) => item.emoji);
    expect(emojis).toContain("🌸");
    expect(emojis).toContain("🌹");
  });

  it("should return empty array for unknown category", () => {
    expect(getEmojisByCategory("NonexistentCategory")).toEqual([]);
  });
});

describe("visual similarity edge cases", () => {
  it("should NOT have king map to lion (misleading alias fix)", () => {
    const result = findEmojiByName("king");
    // King should NOT return lion - that was a misleading alias we removed
    if (result) {
      expect(result.emoji).not.toBe("🦁");
    }
  });

  it("should have wave map to hand wave, not water wave", () => {
    // "wave" as a greeting should map to hand wave
    const result = findEmojiByName("wave");
    if (result) {
      expect(result.emoji).toBe("👋");
    }
  });

  it("should distinguish clocks by time but group them for similarity", () => {
    // All clocks share "clock" name for similarity
    expect(areVisuallySimilar("🕛", "🕐")).toBe(true);
    expect(areVisuallySimilar("⏰", "🕛")).toBe(true);
  });

  it("should distinguish moon phases but group them for similarity", () => {
    expect(areVisuallySimilar("🌑", "🌕")).toBe(true); // new moon vs full moon
    expect(areVisuallySimilar("🌙", "🌛")).toBe(true);
  });
});
