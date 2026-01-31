import { getAllEmojiNames } from "./emoji-data";
import { shuffle } from "./shuffle";

// CSS color names for suggestions
const COLOR_NAMES = [
  "red",
  "blue",
  "green",
  "yellow",
  "orange",
  "purple",
  "pink",
  "brown",
  "black",
  "white",
  "gray",
];

/**
 * Returns n random unique suggestions (mix of colors and emoji names)
 */
export function getRandomSuggestions(count: number = 4): string[] {
  const emojiNames = getAllEmojiNames();
  const allSuggestions = [...COLOR_NAMES, ...emojiNames];

  // Shuffle and take count items
  const shuffled = shuffle([...allSuggestions]);
  return shuffled.slice(0, count);
}
