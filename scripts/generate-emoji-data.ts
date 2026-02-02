#!/usr/bin/env npx tsx
/**
 * Emoji database generator.
 *
 * Downloads Unicode emoji-test.txt and CLDR annotations, then generates:
 * - EMOJI_DATABASE: Categorized emoji data with names and keywords
 * - NAME_TO_EMOJI: Pre-computed name lookup map
 * - EMOJI_TO_KEYWORDS: Pre-computed keyword map for similarity detection
 * - EMOJI_TO_CATEGORY: Pre-computed category map
 * - SHORTEST_EMOJI_NAMES: Unique shortest names for suggestions
 *
 * This moves all lookup map generation from runtime to build time.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import moby from "moby";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

// =============================================================================
// Configuration
// =============================================================================

const EMOJI_TEST_URL =
  "https://www.unicode.org/Public/emoji/latest/emoji-test.txt";
const CLDR_JSON_BASE_URL =
  "https://raw.githubusercontent.com/unicode-org/cldr-json/main/cldr-json";
const LOCALES = ["en", "vi"] as const;

const OUTPUT_PATH = path.join(repoRoot, "lib", "emoji-data.generated.ts");
const CACHE_DIR = path.join(repoRoot, ".cache", "emoji-data");

const INCLUDE_STATUSES = new Set(["fully-qualified", "component"]);

// =============================================================================
// Types
// =============================================================================

interface EmojiTestEntry {
  emoji: string;
  version: string;
  name: string;
  group: string;
  subgroup: string;
  status: string;
}

interface AnnotationData {
  tts?: string;
  keywords: string[];
}

interface LocaleData {
  annotations: Map<string, AnnotationData>;
  derived: Map<string, AnnotationData>;
}

interface EmojiItem {
  emoji: string;
  names: string[];
  keywords: string[];
  emoji_alias?: string[];
}

interface EmojiCategory {
  category: string;
  items: EmojiItem[];
}

interface PromotionCandidate {
  emoji: string;
  tts: string;
  isInflectionMatch: boolean; // "cherry" matches "cherries" via inflection
  isLastWord: boolean; // keyword is the last word of compound TTS
  modifierRank: number; // word frequency rank of modifier (lower = more common)
}

// =============================================================================
// Inflection helpers for English singular/plural matching
// =============================================================================
// "cherries" → "cherry", "cars" → "car", etc.
// This allows "cherry" to match 🍒 "cherries" as an exact match.
// =============================================================================

function getSingularForms(word: string): string[] {
  const lower = word.toLowerCase();
  const forms = [lower];

  // cherries → cherry
  if (lower.endsWith("ies") && lower.length > 3) {
    forms.push(lower.slice(0, -3) + "y");
  }
  // buses → bus, boxes → box
  if (lower.endsWith("es") && lower.length > 2) {
    forms.push(lower.slice(0, -2));
  }
  // cars → car (but not "glass" → "glas")
  if (lower.endsWith("s") && !lower.endsWith("ss") && lower.length > 1) {
    forms.push(lower.slice(0, -1));
  }

  return forms;
}

function getPluralForms(word: string): string[] {
  const lower = word.toLowerCase();
  const forms = [lower];

  // cherry → cherries (consonant + y)
  if (/[^aeiou]y$/.test(lower)) {
    forms.push(lower.slice(0, -1) + "ies");
  }
  // bus → buses
  if (/(?:s|x|z|ch|sh)$/.test(lower)) {
    forms.push(lower + "es");
  }
  // car → cars
  forms.push(lower + "s");

  return forms;
}

function areInflectedForms(word1: string, word2: string): boolean {
  const lower1 = word1.toLowerCase();
  const lower2 = word2.toLowerCase();
  if (lower1 === lower2) return true;

  const forms1 = new Set([...getSingularForms(lower1), ...getPluralForms(lower1)]);
  const forms2 = new Set([...getSingularForms(lower2), ...getPluralForms(lower2)]);

  for (const form of forms1) {
    if (forms2.has(form)) return true;
  }
  return false;
}

// =============================================================================
// Word frequency data for modifier ranking
// =============================================================================
// When multiple compound TTS names compete (e.g., "birthday cake" vs "moon cake"),
// prefer the one with more common modifier word.
// Source: https://github.com/first20hours/google-10000-english
// Lower rank = more common word. Words not in list get rank 99999.
// =============================================================================

const WORD_FREQUENCY_URL =
  "https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english.txt";

let wordFrequencyRank: Map<string, number> | null = null;

async function loadWordFrequency(): Promise<Map<string, number>> {
  if (wordFrequencyRank) return wordFrequencyRank;

  const text = await fetchTextCached(WORD_FREQUENCY_URL, "google-10000-english.txt");
  const lines = text.split(/\r?\n/).filter(Boolean);

  wordFrequencyRank = new Map();
  for (let i = 0; i < lines.length; i++) {
    const word = lines[i].trim().toLowerCase();
    if (word) {
      wordFrequencyRank.set(word, i + 1); // 1-indexed rank
    }
  }

  return wordFrequencyRank;
}

function getWordRank(word: string, ranks: Map<string, number>): number {
  return ranks.get(word.toLowerCase()) ?? 99999;
}

// =============================================================================
// URL helpers
// =============================================================================

const annotationsUrl = (locale: string) =>
  `${CLDR_JSON_BASE_URL}/cldr-annotations-full/annotations/${locale}/annotations.json`;
const annotationsDerivedUrl = (locale: string) =>
  `${CLDR_JSON_BASE_URL}/cldr-annotations-derived-full/annotationsDerived/${locale}/annotations.json`;

// =============================================================================
// Fetch helpers
// =============================================================================

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status} ${response.statusText} while fetching ${url}`
    );
  }
  return response.text();
}

async function fetchTextCached(url: string, cacheFile: string): Promise<string> {
  const cachePath = path.join(CACHE_DIR, cacheFile);
  if (fs.existsSync(cachePath)) {
    return fs.readFileSync(cachePath, "utf8");
  }
  const text = await fetchText(url);
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(cachePath, text, "utf8");
  return text;
}

// =============================================================================
// Parsing
// =============================================================================

const SKIN_TONE_REGEX = /[\u{1F3FB}-\u{1F3FF}]/gu;

function normalizeEmojiKey(emoji: string): string {
  return emoji.replace(/[\uFE0E\uFE0F]/g, "");
}

function stripSkinTone(emoji: string): string {
  return emoji.replace(SKIN_TONE_REGEX, "");
}

function parseEmojiTest(text: string): EmojiTestEntry[] {
  const entries: EmojiTestEntry[] = [];
  let group: string | null = null;
  let subgroup: string | null = null;

  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    if (line.startsWith("# group:")) {
      group = line.replace("# group:", "").trim();
      continue;
    }
    if (line.startsWith("# subgroup:")) {
      subgroup = line.replace("# subgroup:", "").trim();
      continue;
    }
    if (line.startsWith("#")) continue;
    if (!line.includes(";")) continue;

    const [left, right] = line.split("#");
    if (!right) continue;
    const leftParts = left.split(";");
    if (leftParts.length < 2) continue;
    const status = leftParts[1].trim();
    if (!INCLUDE_STATUSES.has(status)) continue;

    const match = right.trim().match(/^(\S+)\s+E(\d+(?:\.\d+)?)\s+(.*)$/);
    if (!match) continue;

    if (!group || !subgroup) {
      throw new Error(`Missing group/subgroup for emoji entry: ${line}`);
    }

    entries.push({
      emoji: match[1],
      version: match[2],
      name: match[3],
      group,
      subgroup,
      status,
    });
  }

  return entries;
}

function parseAnnotations(
  jsonText: string,
  rootKey: string
): Map<string, AnnotationData> {
  const parsed = JSON.parse(jsonText);
  const root = parsed[rootKey];
  if (!root || !root.annotations) {
    throw new Error(`Missing ${rootKey}.annotations in CLDR file`);
  }

  const result = new Map<string, AnnotationData>();
  for (const [emoji, data] of Object.entries(root.annotations)) {
    const d = data as { tts?: string | string[]; default?: string[] };
    const tts = Array.isArray(d.tts) ? d.tts[0] : d.tts;
    const keywords = Array.isArray(d.default) ? d.default : [];
    result.set(emoji, { tts, keywords });
  }

  return result;
}

// =============================================================================
// Locale data helpers
// =============================================================================

function getLocaleEntry(
  localeData: Map<string, AnnotationData>,
  emoji: string
): AnnotationData | null {
  const exact = localeData.get(emoji);
  if (exact) return exact;
  const normalized = normalizeEmojiKey(emoji);
  if (normalized !== emoji) {
    return localeData.get(normalized) || null;
  }
  return null;
}

function getEnglishName(localeData: LocaleData, emoji: string): string | null {
  const annotation = getLocaleEntry(localeData.annotations, emoji);
  if (annotation?.tts) return annotation.tts;
  const derived = getLocaleEntry(localeData.derived, emoji);
  if (derived?.tts) return derived.tts;
  return null;
}

function collectLocaleNames(localeData: LocaleData, emoji: string): string[] {
  const names: string[] = [];
  const annotation = getLocaleEntry(localeData.annotations, emoji);
  const derived = getLocaleEntry(localeData.derived, emoji);
  if (annotation?.tts) names.push(annotation.tts);
  if (derived?.tts) names.push(derived.tts);
  return names;
}

function collectLocaleKeywords(localeData: LocaleData, emoji: string): string[] {
  const keywords: string[] = [];
  const annotation = getLocaleEntry(localeData.annotations, emoji);
  const derived = getLocaleEntry(localeData.derived, emoji);
  if (annotation?.keywords) keywords.push(...annotation.keywords);
  if (derived?.keywords) keywords.push(...derived.keywords);
  return keywords;
}

// =============================================================================
// Category mapping
// =============================================================================

const CATEGORY_BY_GROUP: Record<string, Record<string, string>> = {
  "Smileys & Emotion": {
    "cat-face": "internal:cat-face",
    emotion: "faces",
    "face-affection": "faces",
    "face-concerned": "faces",
    "face-costume": "faces",
    "face-glasses": "faces",
    "face-hand": "faces",
    "face-hat": "faces",
    "face-negative": "faces",
    "face-neutral-skeptical": "faces",
    "face-sleepy": "faces",
    "face-smiling": "faces",
    "face-tongue": "faces",
    "face-unwell": "faces",
    heart: "faces",
    "monkey-face": "internal:monkey-face",
  },
  "People & Body": {
    "body-parts": "people",
    family: "internal:family",
    "hand-fingers-closed": "internal:hands",
    "hand-fingers-open": "internal:hands",
    "hand-fingers-partial": "internal:hands",
    "hand-prop": "people",
    "hand-single-finger": "internal:hands",
    hands: "internal:hands",
    person: "people",
    "person-activity": "internal:person-activity",
    "person-fantasy": "fantasy",
    "person-gesture": "people",
    "person-resting": "people",
    "person-role": "people",
    "person-sport": "sports",
    "person-symbol": "internal:person-symbol",
  },
  "Animals & Nature": {
    "animal-amphibian": "animals",
    "animal-bird": "animals",
    "animal-bug": "animals",
    "animal-mammal": "animals",
    "animal-marine": "animals",
    "animal-reptile": "animals",
    "plant-flower": "nature",
    "plant-other": "nature",
    "sky & weather": "weather",
  },
  "Food & Drink": {
    dishware: "objects",
    drink: "drinks",
    "food-asian": "food",
    "food-fruit": "fruits",
    "food-prepared": "food",
    "food-sweet": "food",
    "food-vegetable": "vegetables",
  },
  "Travel & Places": {
    hotel: "places",
    "place-building": "places",
    "place-geographic": "places",
    // Globes (🌍🌎🌏) and maps (🗺️🗾) are internal to prevent:
    // - "australia" → 🌏 globe (should be 🇦🇺 flag)
    // - "japan" → 🗾 map (should be 🇯🇵 flag)
    "place-map": "internal:place-map",
    "place-other": "places",
    "place-religious": "places",
    "sky & weather": "weather",
    time: "time",
    "transport-air": "vehicles",
    "transport-ground": "vehicles",
    "transport-water": "vehicles",
  },
  Activities: {
    "arts & crafts": "arts",
    "award-medal": "objects",
    event: "celebration",
    game: "games",
    sport: "sports",
  },
  Objects: {
    "book-paper": "school",
    clothing: "clothing",
    computer: "objects",
    household: "objects",
    "light & video": "objects",
    lock: "objects",
    mail: "objects",
    medical: "medical",
    money: "objects",
    music: "music",
    "musical-instrument": "music",
    office: "school",
    "other-object": "objects",
    phone: "objects",
    science: "medical",
    sound: "music",
    tool: "tools",
    writing: "school",
  },
  Symbols: {
    alphanum: "symbols",
    arrow: "symbols",
    "av-symbol": "symbols",
    currency: "symbols",
    gender: "symbols",
    geometric: "shapes",
    keycap: "symbols",
    math: "symbols",
    "other-symbol": "symbols",
    punctuation: "symbols",
    religion: "symbols",
    time: "time",
    "transport-sign": "symbols",
    warning: "symbols",
    zodiac: "symbols",
  },
  Flags: {
    "country-flag": "country",
    flag: "flags",
    "subdivision-flag": "flags",
  },
  Component: {
    "hair-style": "internal:component",
    "skin-tone": "internal:component",
  },
};

function mapCategory(group: string, subgroup: string): string {
  const groupMap = CATEGORY_BY_GROUP[group];
  if (!groupMap) {
    throw new Error(`Unexpected group "${group}"`);
  }
  const category = groupMap[subgroup];
  if (!category) {
    throw new Error(`Unexpected subgroup "${subgroup}" for group "${group}"`);
  }
  return category;
}

function isInternalCategory(category: string): boolean {
  return category.startsWith("internal:");
}

// =============================================================================
// Database building
// =============================================================================

interface BuildResult {
  database: EmojiCategory[];
  nameToEmoji: Record<string, string>;
  emojiToKeywords: Record<string, string[]>;
  emojiToCategory: Record<string, string>;
  shortestEmojiNames: string[];
}

function buildEmojiDatabase(
  entries: EmojiTestEntry[],
  localeData: Record<string, LocaleData>,
  wordRanks: Map<string, number>
): BuildResult {
  const categories = new Map<string, EmojiItem[]>();
  const seen = new Set<string>();
  const emojiByKey = new Map<string, string>();

  for (const entry of entries) {
    const key = normalizeEmojiKey(entry.emoji);
    if (!emojiByKey.has(key)) {
      emojiByKey.set(key, entry.emoji);
    }
  }

  const aliasMap = new Map<string, string[]>();
  const keywordCounts = new Map<string, number>();

  // =========================================================================
  // PHASE 1: Count word frequency and collect promotion candidates
  // =========================================================================
  // Problem: CLDR keywords like "dog" are useful for search but aren't in
  // the emoji's names array. We want to promote some keywords to names.
  //
  // However, naive promotion causes conflicts: "cake" appears in both
  // "fish cake" and "birthday cake" TTS names. Without coordination,
  // whichever emoji processes first claims "cake".
  //
  // Solution: Two-phase approach. First, collect ALL potential promotions
  // with metadata (TTS length, exact match). Then in Phase 2, pick winners.
  // =========================================================================
  const promotionCandidates = new Map<string, PromotionCandidate[]>();

  for (const entry of entries) {
    const baseEmoji = emojiByKey.get(
      normalizeEmojiKey(stripSkinTone(entry.emoji))
    );
    const entryKey = normalizeEmojiKey(entry.emoji);
    const baseKey = baseEmoji ? normalizeEmojiKey(baseEmoji) : null;

    // Skin tone variants (👋🏻, 👋🏿) should share the base emoji's names,
    // not compete for keywords separately
    if (baseEmoji && baseKey && baseKey !== entryKey) {
      if (!aliasMap.has(baseEmoji)) {
        aliasMap.set(baseEmoji, []);
      }
      aliasMap.get(baseEmoji)!.push(entry.emoji);
      continue; // Skip skin tone variants for counting
    }

    // Count how many emojis use each word (in names or keywords).
    // Used later to: (1) promote unique keywords, (2) filter overly common ones
    const countWord = (word: string) => {
      const lower = word.toLowerCase();
      keywordCounts.set(lower, (keywordCounts.get(lower) || 0) + 1);
    };

    for (const locale of LOCALES) {
      const localeNames = collectLocaleNames(localeData[locale], entry.emoji);
      for (const name of localeNames) {
        // Tokenize "dog face" → ["dog", "face"] so both words get counted
        const words = name.split(/[^a-zA-Z0-9]+/).filter(Boolean);
        for (const word of words) {
          countWord(word);
        }
      }

      const localeKeywords = collectLocaleKeywords(
        localeData[locale],
        entry.emoji
      );
      for (const keyword of localeKeywords) {
        countWord(keyword);
      }
    }

    // If a keyword appears in the emoji's TTS name, it's a promotion candidate.
    // e.g., 🐶 TTS="dog face", keyword="dog" → "dog" is candidate
    const englishTts = getEnglishName(localeData["en"], entry.emoji) || "";
    const ttsWordsArray = englishTts
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean);
    const ttsWords = new Set(ttsWordsArray);
    const allKeywords = collectLocaleKeywords(localeData["en"], entry.emoji);
    const lastTtsWord = ttsWordsArray[ttsWordsArray.length - 1] || "";

    for (const keyword of allKeywords) {
      const lowerKeyword = keyword.toLowerCase();

      // Check for exact match (with inflection support)
      // "cherry" matches "cherries" as inflection match
      const isInflectionMatch = areInflectedForms(lowerKeyword, englishTts);
      const inTts = ttsWords.has(lowerKeyword);

      if (isInflectionMatch || inTts) {
        // Check if keyword is the last word of compound TTS
        // "cake" is last word in "birthday cake" but not in "cakewalk"
        const isLastWord = areInflectedForms(lowerKeyword, lastTtsWord);

        // Get modifier word rank for compound TTS names
        // For "birthday cake", modifier is "birthday"
        // For "person bouncing ball", modifier is "bouncing" (word before "ball")
        let modifierRank = 99999;
        if (ttsWordsArray.length >= 2 && isLastWord) {
          // Get rank of the word immediately before the last word
          const modifier = ttsWordsArray[ttsWordsArray.length - 2];
          modifierRank = getWordRank(modifier, wordRanks);
        }

        if (!promotionCandidates.has(lowerKeyword)) {
          promotionCandidates.set(lowerKeyword, []);
        }
        promotionCandidates.get(lowerKeyword)!.push({
          emoji: entry.emoji,
          tts: englishTts,
          isInflectionMatch,
          isLastWord,
          modifierRank,
        });
      }
    }
  }

  // =========================================================================
  // PHASE 2: Pick one winner per keyword
  // =========================================================================
  // When multiple emojis want the same keyword, we use these tiebreakers:
  //
  // 1. Inflection match wins (🍒 "cherries" beats 🌸 "cherry blossom" for "cherry")
  // 2. Last word match wins (keyword is the head noun of compound)
  // 3. More common modifier wins (🎂 "birthday cake" beats 🥮 "moon cake")
  // 4. Shorter TTS wins (more specific emoji)
  //
  // This ensures deterministic, intuitive mappings without manual overrides.
  // =========================================================================
  const keywordWinners = new Map<string, string>();

  for (const [, candidates] of promotionCandidates) {
    candidates.sort((a, b) => {
      // 1. Inflection match wins (cherry ↔ cherries counts as exact)
      if (a.isInflectionMatch && !b.isInflectionMatch) return -1;
      if (!a.isInflectionMatch && b.isInflectionMatch) return 1;

      // 2. Last word match wins (keyword is head noun of compound)
      if (a.isLastWord && !b.isLastWord) return -1;
      if (!a.isLastWord && b.isLastWord) return 1;

      // 3. More common modifier wins (lower rank = more common)
      if (a.modifierRank !== b.modifierRank) {
        return a.modifierRank - b.modifierRank;
      }

      // 4. Shorter TTS wins (more specific emoji)
      return a.tts.length - b.tts.length;
    });
  }

  // Now set the winners using the original keywords
  for (const [keyword, candidates] of promotionCandidates) {
    keywordWinners.set(keyword, candidates[0].emoji);
  }

  // =========================================================================
  // PHASE 3: Build emoji items with promoted names
  // =========================================================================
  const emojiToKeywordsMap = new Map<string, string[]>();
  const emojiToCategoryMap = new Map<string, string>();

  for (const entry of entries) {
    const baseEmoji = emojiByKey.get(
      normalizeEmojiKey(stripSkinTone(entry.emoji))
    );
    const entryKey = normalizeEmojiKey(entry.emoji);
    const baseKey = baseEmoji ? normalizeEmojiKey(baseEmoji) : null;
    if (baseEmoji && baseKey && baseKey !== entryKey) {
      continue;
    }
    if (seen.has(entry.emoji)) continue;
    seen.add(entry.emoji);

    const category = mapCategory(entry.group, entry.subgroup);
    const names = new Set<string>();

    for (const locale of LOCALES) {
      const localeNames = collectLocaleNames(localeData[locale], entry.emoji);
      for (const name of localeNames) {
        // Strip " face" suffix for face emojis so "grinning face" becomes
        // searchable as just "grinning"
        if (category === "faces") {
          if (name.endsWith(" face")) {
            names.add(name.slice(0, -5));
            continue;
          }
        } else if (category === "country") {
          // Strip "flag: " prefix so "flag: Japan" becomes searchable as "Japan"
          const withoutPrefixName = name.replace(/^[^:]+:\s+/, "").trim();
          if (withoutPrefixName) {
            names.add(name.replace(/^[^:]+:\s+/, ""));
            continue;
          }
        }
        names.add(name);
      }
    }

    // Promote keywords to names so they become searchable via findEmojiByName()
    const allKeywords = collectLocaleKeywords(localeData["en"], entry.emoji);
    const lowerNames = new Set([...names].map((n) => n.toLowerCase()));

    for (const keyword of allKeywords) {
      const lowerKeyword = keyword.toLowerCase();
      if (lowerNames.has(lowerKeyword)) continue;

      // Only promote if this emoji won the keyword in Phase 2
      const winner = keywordWinners.get(lowerKeyword);
      if (winner === entry.emoji) {
        names.add(keyword);
        lowerNames.add(lowerKeyword);
        continue;
      }

      // Always promote unique keywords (count=1) - no conflict possible
      const isUnique = keywordCounts.get(lowerKeyword) === 1;
      if (isUnique) {
        names.add(keyword);
        lowerNames.add(lowerKeyword);
      }
    }

    // Keep keywords with count 2-10 for similarity detection.
    // Too common (>10) creates false positives; unique (=1) already promoted.
    const keywords = allKeywords.filter((k) => {
      const count = keywordCounts.get(k.toLowerCase());
      return count !== undefined && count > 1 && count <= 10;
    });

    const item: EmojiItem = {
      emoji: entry.emoji,
      names: [...names],
      keywords,
    };

    const aliases = aliasMap.get(entry.emoji);
    if (aliases && aliases.length > 0) {
      item.emoji_alias = aliases;
    }

    if (!categories.has(category)) {
      categories.set(category, []);
    }
    categories.get(category)!.push(item);

    const emojiKey = normalizeEmojiKey(entry.emoji);
    emojiToKeywordsMap.set(emojiKey, keywords);
    emojiToCategoryMap.set(emojiKey, category);
  }

  // =========================================================================
  // PHASE 4: Build lookup maps for runtime use
  // =========================================================================
  // Pre-compute these at build time so emoji-data.ts doesn't need to
  // iterate the entire database on every import.
  // =========================================================================
  const database = [...categories.entries()].map(([category, items]) => ({
    category,
    items,
  }));

  // Internal categories (cat-face, hands, etc.) group similar-looking emojis
  // for similarity detection, but shouldn't be directly searchable.
  // e.g., 😺 is in internal:cat-face - we don't want "cat" → 😺
  const nameToEmoji: Record<string, string> = {};
  for (const cat of database) {
    if (isInternalCategory(cat.category)) continue;
    for (const item of cat.items) {
      for (const name of item.names) {
        const lowerName = name.toLowerCase().trim();
        if (!lowerName) continue;
        // First emoji to register a name wins (database order)
        if (!(lowerName in nameToEmoji)) {
          nameToEmoji[lowerName] = item.emoji;
        }
      }
    }
  }

  // =========================================================================
  // PHASE 5: Moby-based keyword promotion
  // =========================================================================
  // For keywords that aren't already names, check if their moby synonyms
  // match any of the emoji's existing names. This systematically promotes
  // keywords like "sheep" when moby says sheep ↔ ewe (and "ewe" is a name).
  //
  // Also handles compound names: if keyword's synonym matches a word within
  // the emoji's own compound TTS name (e.g., "juice" → "beverage" matches
  // "beverage box" for 🧃).
  // =========================================================================
  console.log("  - Running moby-based keyword promotion...");
  let mobyPromotions = 0;

  for (const cat of database) {
    if (isInternalCategory(cat.category)) continue;
    for (const item of cat.items) {
      const existingNames = new Set(item.names.map((n) => n.toLowerCase()));
      const allKeywords = emojiToKeywordsMap.get(normalizeEmojiKey(item.emoji)) || [];

      // Build set of words from this emoji's compound names (names with 2+ words)
      const compoundNameWords = new Set<string>();
      for (const name of item.names) {
        const words = name.toLowerCase().split(/\s+/);
        if (words.length >= 2) {
          for (const word of words) {
            if (word.length >= 3) {
              compoundNameWords.add(word);
            }
          }
        }
      }

      for (const keyword of allKeywords) {
        const lowerKeyword = keyword.toLowerCase();
        // Skip if already a name for this or any emoji
        if (existingNames.has(lowerKeyword)) continue;
        if (lowerKeyword in nameToEmoji) continue;

        // Get moby synonyms for this keyword
        const synonyms = moby.search(keyword) as string[] | null;
        if (!synonyms) continue;

        // Check if any synonym matches one of this emoji's names (exact match)
        const synonymSet = new Set(synonyms.map((s) => s.toLowerCase().trim()));
        let foundMatch = false;
        for (const name of existingNames) {
          if (synonymSet.has(name)) {
            // The keyword's synonyms include this emoji's name
            // So the keyword is semantically equivalent - promote it
            nameToEmoji[lowerKeyword] = item.emoji;
            mobyPromotions++;
            foundMatch = true;
            break;
          }
        }

        // If no exact match, check if synonym matches a word in THIS emoji's compound names
        if (!foundMatch && compoundNameWords.size > 0) {
          for (const syn of synonyms) {
            const lowerSyn = syn.toLowerCase().trim();
            if (compoundNameWords.has(lowerSyn)) {
              // The keyword's synonym is part of this emoji's compound name
              nameToEmoji[lowerKeyword] = item.emoji;
              mobyPromotions++;
              foundMatch = true;
              break;
            }
          }
        }
      }
    }
  }

  console.log(`  - Moby promotions: ${mobyPromotions} keywords promoted`);

  const shortestNames = new Set<string>();
  for (const cat of database) {
    if (isInternalCategory(cat.category)) continue;
    for (const item of cat.items) {
      const shortest = item.names.reduce((a, b) =>
        a.length <= b.length ? a : b
      );
      shortestNames.add(shortest);
    }
  }

  return {
    database,
    nameToEmoji,
    emojiToKeywords: Object.fromEntries(emojiToKeywordsMap),
    emojiToCategory: Object.fromEntries(emojiToCategoryMap),
    shortestEmojiNames: [...shortestNames],
  };
}

// =============================================================================
// Output generation
// =============================================================================

function writeOutput(result: BuildResult): void {
  const header = `/**
 * Emoji database with pre-computed lookup maps.
 * Generated by scripts/generate-emoji-data.ts
 *
 * Sources:
 * - Unicode emoji-test.txt (${EMOJI_TEST_URL})
 * - Unicode CLDR annotations (${CLDR_JSON_BASE_URL})
 * - Locales: ${LOCALES.join(", ")}
 *
 * DO NOT EDIT - This file is auto-generated.
 */

`;

  const types = `export interface EmojiItem {
  emoji: string;
  names: string[];
  keywords: string[];
  emoji_alias?: string[];
}

export interface EmojiCategory {
  category: string;
  items: EmojiItem[];
}

`;

  const body = `/** Categorized emoji database */
export const EMOJI_DATABASE: EmojiCategory[] = ${JSON.stringify(result.database, null, 2)};

/** Pre-computed name -> emoji lookup (lowercase keys, skips internal categories) */
export const NAME_TO_EMOJI: Record<string, string> = ${JSON.stringify(result.nameToEmoji, null, 2)};

/** Pre-computed emoji -> keywords lookup (for similarity detection) */
export const EMOJI_TO_KEYWORDS: Record<string, string[]> = ${JSON.stringify(result.emojiToKeywords, null, 2)};

/** Pre-computed emoji -> category lookup */
export const EMOJI_TO_CATEGORY: Record<string, string> = ${JSON.stringify(result.emojiToCategory, null, 2)};

/** Unique shortest names for suggestions (excludes internal categories) */
export const SHORTEST_EMOJI_NAMES: string[] = ${JSON.stringify(result.shortestEmojiNames, null, 2)};
`;

  fs.writeFileSync(OUTPUT_PATH, header + types + body, "utf8");
}

// =============================================================================
// Main
// =============================================================================

async function main(): Promise<void> {
  const emojiTestText = await fetchTextCached(EMOJI_TEST_URL, "emoji-test.txt");
  const entries = parseEmojiTest(emojiTestText);

  const localeData: Record<string, LocaleData> = {};
  for (const locale of LOCALES) {
    const annotationsText = await fetchTextCached(
      annotationsUrl(locale),
      `annotations.${locale}.json`
    );
    const derivedText = await fetchTextCached(
      annotationsDerivedUrl(locale),
      `annotationsDerived.${locale}.json`
    );
    localeData[locale] = {
      annotations: parseAnnotations(annotationsText, "annotations"),
      derived: parseAnnotations(derivedText, "annotationsDerived"),
    };
  }

  const wordRanks = await loadWordFrequency();
  const result = buildEmojiDatabase(entries, localeData, wordRanks);
  writeOutput(result);

  execSync(`npx prettier --write "${OUTPUT_PATH}"`, { stdio: "inherit" });

  const emojiCount = entries.length;
  const categoryCount = result.database.length;
  const nameCount = Object.keys(result.nameToEmoji).length;

  console.log(
    `Generated ${OUTPUT_PATH}:\n` +
      `  - ${emojiCount} emojis across ${categoryCount} categories\n` +
      `  - ${nameCount} name lookups\n` +
      `  - ${result.shortestEmojiNames.length} unique shortest names`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
