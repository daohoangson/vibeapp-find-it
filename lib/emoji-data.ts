import "server-only";

/**
 * Emoji database with categories for generating game content without LLM.
 * Generated from Unicode emoji-test.txt + CLDR annotations.
 * See scripts/generate-emoji-data.mjs for sources and generation rules.
 */
import { shuffle } from "./shuffle";
import { EMOJI_DATABASE as RAW_EMOJI_DATABASE } from "./emoji-data.generated";

/**
 *
 * NAME DESIGN:
 * - First name: PRIMARY - used for display, should be specific
 * - Additional names: ALIASES - used for visual similarity grouping
 * - keywords: SEARCH ALIASES - used for lookup, not similarity
 * - If two emojis share ANY name, they are considered visually similar
 *   (used for de-duplication in game logic)
 */

export interface EmojiItem {
  names: string[]; // First name is primary, others are aliases/group markers
  keywords: string[]; // Search-only aliases (not used for similarity)
  emoji: string;
}

interface EmojiCategory {
  category: string;
  items: EmojiItem[];
}

const EMOJI_DATABASE: EmojiCategory[] =
  RAW_EMOJI_DATABASE as unknown as EmojiCategory[];

// =============================================================================
// Lookup Maps (built at module load time)
// =============================================================================

/** Map from display name/alias -> first emoji that uses it */
const nameToEmoji = new Map<string, string>();

/** Map from keyword alias -> first emoji that uses it (only if no name match) */
const keywordToEmoji = new Map<string, string>();

/** Map from emoji -> all its names */
const emojiToNames = new Map<string, string[]>();

/** Map from emoji -> category */
const emojiToCategory = new Map<string, string>();

/** Map from category -> emoji items */
const categoryToItems = new Map<string, EmojiItem[]>();

const normalizeEmoji = (emoji: string) => emoji.replace(/[\uFE0E\uFE0F]/g, "");
const normalizeName = (name: string) => name.toLowerCase().trim();
const NAME_OVERRIDES = new Map<string, string>([["puppy", "🐶"]]);

const allItems: EmojiItem[] = [];

// Build category/emoji lookup maps
EMOJI_DATABASE.forEach((cat) => {
  categoryToItems.set(cat.category, cat.items);
  cat.items.forEach((item) => {
    allItems.push(item);
    const emojiKey = normalizeEmoji(item.emoji);
    if (!emojiToNames.has(emojiKey)) {
      emojiToNames.set(emojiKey, item.names);
    }
    if (!emojiToCategory.has(emojiKey)) {
      emojiToCategory.set(emojiKey, cat.category);
    }
  });
});

// Build name lookup map (names always win over keywords)
allItems.forEach((item) => {
  item.names.forEach((name) => {
    const lowerName = normalizeName(name);
    if (!lowerName) return;
    if (!nameToEmoji.has(lowerName)) {
      nameToEmoji.set(lowerName, item.emoji);
    }
  });
});

// Build keyword lookup map (only if no name match exists)
allItems.forEach((item) => {
  item.keywords.forEach((keyword) => {
    const lowerKeyword = normalizeName(keyword);
    if (!lowerKeyword) return;
    if (nameToEmoji.has(lowerKeyword)) return;
    if (!keywordToEmoji.has(lowerKeyword)) {
      keywordToEmoji.set(lowerKeyword, item.emoji);
    }
  });
});

// =============================================================================
// Public API
// =============================================================================

/**
 * Look up an emoji by name (case-insensitive)
 * Returns the FIRST emoji that matches (by definition order)
 */
export function findEmojiByName(
  name: string,
): { emoji: string; category: string } | null {
  const normalized = normalizeName(name);
  const overrideEmoji = NAME_OVERRIDES.get(normalized);
  if (overrideEmoji) {
    const overrideCategory = emojiToCategory.get(normalizeEmoji(overrideEmoji));
    if (overrideCategory) {
      return { emoji: overrideEmoji, category: overrideCategory };
    }
  }
  const emoji = nameToEmoji.get(normalized) ?? keywordToEmoji.get(normalized);
  if (!emoji) return null;
  const category = emojiToCategory.get(normalizeEmoji(emoji));
  if (!category) return null;
  return { emoji, category };
}

/**
 * Get all emojis in a category
 */
export function getEmojisByCategory(category: string): EmojiItem[] {
  return categoryToItems.get(category) || [];
}

/**
 * Get the category for an emoji
 */
export function getCategoryByEmoji(emoji: string): string | null {
  return emojiToCategory.get(normalizeEmoji(emoji)) || null;
}

/**
 * Check if two emojis are visually similar (share any name)
 */
export function areVisuallySimilar(emoji1: string, emoji2: string): boolean {
  const names1 = emojiToNames.get(normalizeEmoji(emoji1));
  const names2 = emojiToNames.get(normalizeEmoji(emoji2));
  if (!names1 || !names2) return false;

  const names1Lower = new Set(names1.map((n) => n.toLowerCase()));
  return names2.some((n) => names1Lower.has(n.toLowerCase()));
}

/**
 * Get random distractors from the same category (excluding visually similar)
 */
export function getDistractors(
  targetEmoji: string,
  category: string,
  count: number = 2,
): string[] {
  const categoryItems = getEmojisByCategory(category);
  const targetKey = normalizeEmoji(targetEmoji);

  // Filter out the target and any visually similar emojis
  const validDistractors = categoryItems.filter((item) => {
    const itemKey = normalizeEmoji(item.emoji);
    return (
      itemKey !== targetKey && !areVisuallySimilar(targetEmoji, item.emoji)
    );
  });

  // Shuffle and take count items
  const shuffled = shuffle([...validDistractors]);
  return shuffled.slice(0, count).map((item) => item.emoji);
}

/**
 * Get unique shortest names from all emojis for suggestions.
 * Deduplicates since multiple emojis may share the same shortest name (e.g., "flower").
 */
export function getShortestEmojiNames(): string[] {
  const names = new Set<string>();
  EMOJI_DATABASE.forEach((cat) => {
    cat.items.forEach((item) => {
      // Pick the shortest name for display
      const shortest = item.names.reduce((a, b) =>
        a.length <= b.length ? a : b,
      );
      names.add(shortest);
    });
  });
  return [...names];
}
