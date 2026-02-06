import "server-only";

import { generateText, Output } from "ai";
import {
  findEmojiByName,
  getDistractors,
  areVisuallySimilar,
  getCategoryByEmoji,
  getEmojisByCategory,
} from "./emoji-data";
import { shuffle } from "./shuffle";
import { GameContentSchema, type GameContent } from "./schema";

const LLM_SYSTEM_PROMPT = `You are a helpful assistant for a children's educational game called "Find It!".
A parent has entered a word, and you need to generate game content for their child to find.

Rules:
1. If the word is a COLOR (like "red", "blue", "verde", "rot", etc. in any language):
   - Set type to "color"
   - Set targetValue to a valid CSS color name (e.g., "red", "blue", "green")
   - Set distractors to 2 OTHER distinct CSS color names that are visually different

2. If the word is ANYTHING ELSE (animal, shape, object, food, etc.):
   - Set type to "emoji"
   - Set targetValue to a single emoji representing the word
   - Set distractors to 2 OTHER related but different emojis from the same category

Important:
- Accept input in ANY language and translate to appropriate content
- Keep emojis simple and recognizable for young children (ages 2-5)
- Make sure all 3 options (target + 2 distractors) are visually distinct
- For colors, use only basic CSS color names children can see clearly`;

// CSS color names that we can handle locally
const CSS_COLORS: Record<string, string> = {
  red: "red",
  blue: "blue",
  green: "green",
  yellow: "yellow",
  orange: "orange",
  purple: "purple",
  pink: "pink",
  brown: "brown",
  black: "black",
  white: "white",
  gray: "gray",
  grey: "gray",
  cyan: "cyan",
  magenta: "magenta",
  lime: "lime",
  navy: "navy",
  teal: "teal",
  maroon: "maroon",
  olive: "olive",
  aqua: "aqua",
  gold: "gold",
  silver: "silver",
  // Common color words in other languages
  rojo: "red", // Spanish
  azul: "blue",
  verde: "green",
  amarillo: "yellow",
  naranja: "orange",
  morado: "purple",
  rosa: "pink",
  rouge: "red", // French
  bleu: "blue",
  vert: "green",
  jaune: "yellow",
  rot: "red", // German
  blau: "blue",
  grün: "green",
  gelb: "yellow",
};

// Color distractors grouped by visual similarity
const COLOR_GROUPS = [
  ["red", "orange", "pink", "maroon"],
  ["blue", "cyan", "navy", "teal"],
  ["green", "lime", "olive", "teal"],
  ["yellow", "gold", "orange", "lime"],
  ["purple", "magenta", "pink", "navy"],
  ["brown", "maroon", "orange", "olive"],
  ["black", "gray", "navy", "brown"],
  ["white", "silver", "gray", "cyan"],
];

function getColorDistractors(targetColor: string, count: number = 2): string[] {
  // Find which group the color belongs to
  const group = COLOR_GROUPS.find((g) => g.includes(targetColor));

  // Get colors NOT in the same group for better visual distinction
  const otherColors = Object.values(CSS_COLORS).filter(
    (c) => c !== targetColor && (!group || !group.includes(c)),
  );

  // Shuffle and pick
  const shuffled = shuffle([...new Set(otherColors)]);
  return shuffled.slice(0, count);
}

/**
 * Try to generate game content locally without LLM.
 * Returns null if we can't match the word locally.
 */
export function generateLocalContent(word: string): GameContent | null {
  const normalizedWord = word.toLowerCase().trim();

  // Check if it's a color
  const cssColor = CSS_COLORS[normalizedWord];
  if (cssColor) {
    return {
      type: "color",
      targetValue: cssColor,
      distractors: getColorDistractors(cssColor) as [string, string],
    };
  }

  // Check if it's an emoji name
  const emojiMatch = findEmojiByName(normalizedWord);
  if (emojiMatch) {
    const distractors = getDistractors(emojiMatch.emoji, emojiMatch.category, 2);

    // If we don't have enough distractors in the same category, return null
    // (let LLM handle it)
    if (distractors.length < 2) {
      return null;
    }

    return {
      type: "emoji",
      targetValue: emojiMatch.emoji,
      distractors: distractors as [string, string],
    };
  }

  // No local match found
  return null;
}

/**
 * Auto-fix LLM response if it contains visually similar emojis.
 * Replaces similar distractors with non-similar ones from same category.
 */
export function fixVisuallySimilarEmojis(content: GameContent): GameContent {
  if (content.type !== "emoji") {
    return content;
  }

  const target = content.targetValue;
  const distractors = [...content.distractors];
  let needsFix = false;

  // Check each distractor for visual similarity to target
  for (let i = 0; i < distractors.length; i++) {
    if (areVisuallySimilar(target, distractors[i])) {
      needsFix = true;
      break;
    }
  }

  // Also check if distractors are similar to each other
  if (!needsFix && distractors.length >= 2) {
    if (areVisuallySimilar(distractors[0], distractors[1])) {
      needsFix = true;
    }
  }

  if (!needsFix) {
    return content;
  }

  // Try to find the category and get proper distractors
  const category = getCategoryByEmoji(target);
  if (category) {
    const categoryEmojis = getEmojisByCategory(category);
    const validDistractors = categoryEmojis.filter(
      (item) =>
        item.emoji !== target && !areVisuallySimilar(target, item.emoji),
    );

    if (validDistractors.length >= 2) {
      const shuffled = shuffle([...validDistractors]);
      return {
        ...content,
        distractors: [shuffled[0].emoji, shuffled[1].emoji],
      };
    }
  }

  // Fallback: filter out similar ones from original distractors
  const filtered = distractors.filter(
    (d) => !areVisuallySimilar(target, d) && d !== target,
  );

  if (filtered.length >= 2) {
    return {
      ...content,
      distractors: [filtered[0], filtered[1]],
    };
  }

  // If we still can't fix it, return original (LLM might have valid reasoning)
  return content;
}

/**
 * Generate game content for a word.
 * Tries local generation first, falls back to LLM for unknown words.
 */
export async function generateGameContent(
  word: string,
): Promise<GameContent | null> {
  // Try local generation first (fast, no API cost)
  const localContent = generateLocalContent(word);
  if (localContent) {
    return localContent;
  }

  // Fall back to LLM for unknown words
  try {
    const { output } = await generateText({
      model: "google/gemini-2.0-flash-lite",
      output: Output.object({
        schema: GameContentSchema,
      }),
      system: LLM_SYSTEM_PROMPT,
      prompt: `Generate game content for the word: "${word.trim()}"`,
    });

    if (!output) {
      return null;
    }

    // Auto-fix visually similar emojis from LLM response
    return fixVisuallySimilarEmojis(output);
  } catch (error) {
    console.error("LLM generation error:", error);
    return null;
  }
}
