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
import winkNLP from "wink-nlp";
import model from "wink-eng-lite-web-model";
import vectors from "wink-embeddings-sg-100d";
// @ts-expect-error - wink-nlp types don't export similarity
import similarity from "wink-nlp/utilities/similarity.js";

// Initialize wink-nlp with word embeddings
const nlp = winkNLP(model, [], vectors);

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
  isNameMatch: boolean; // keyword exactly matches one of emoji's names
  synonymScore: number; // semantic similarity between keyword and TTS (0-1)
}

// =============================================================================
// Semantic similarity using wink-nlp word embeddings
// =============================================================================
// Problem: CLDR keywords like "car" don't always match emoji TTS names exactly.
// For example, 🚗 has TTS "automobile" but users search for "car".
//
// Solution: Use word embeddings to compute semantic similarity between keywords
// and TTS names. Words with similar meanings (car ↔ automobile) get high scores.
//
// Trade-off: Embeddings favor word overlap, so "cherry blossom" scores higher
// than "cherries" for the keyword "cherry". This is a known limitation.
//
// Technical: Uses wink-nlp's 100D embeddings with cosine similarity.
// For phrases, we average word vectors to get a single phrase vector.
// =============================================================================

function getWordVector(text: string): number[] | null {
  // Try single word first
  const singleVec = nlp.vectorOf(text);
  if (singleVec && singleVec.length > 0 && singleVec.some((v: number) => v !== 0)) {
    return singleVec;
  }

  // For phrases, average word vectors
  const doc = nlp.readDoc(text);
  const tokens = doc.tokens();
  const wordVectors: number[][] = [];

  tokens.each((token: { out: () => string }) => {
    const vec = nlp.vectorOf(token.out());
    if (vec && vec.length > 0 && vec.some((v: number) => v !== 0)) {
      wordVectors.push(vec);
    }
  });

  if (wordVectors.length === 0) return null;

  // Average the vectors
  const dim = wordVectors[0].length;
  const avg = new Array(dim).fill(0);
  for (const vec of wordVectors) {
    for (let i = 0; i < dim; i++) {
      avg[i] += vec[i] / wordVectors.length;
    }
  }
  return avg;
}

function semanticSimilarity(word1: string, word2: string): number {
  const vec1 = getWordVector(word1);
  const vec2 = getWordVector(word2);
  if (!vec1 || !vec2) return 0;
  return similarity.vector.cosine(vec1, vec2) as number;
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
  localeData: Record<string, LocaleData>
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
  // Track unique emojis per word (names + keywords combined).
  // Used for promoting unique keywords.
  const keywordCounts = new Map<string, Set<string>>();
  // Track unique emojis per CLDR keyword only (not names).
  // Used to filter generic keywords.
  const keywordOnlyCounts = new Map<string, Set<string>>();

  // =========================================================================
  // PHASE 1a: Count word frequency across ALL emojis first
  // =========================================================================
  // We need complete frequency counts BEFORE generating candidates, so we can
  // filter out generic keywords like "face" that appear in 100+ emojis.
  // If we count and filter in the same loop, early entries would see incomplete
  // counts and incorrectly pass the frequency filter.
  // =========================================================================
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

    // Track unique emojis that use each word (in names or keywords).
    // Used later to: (1) promote unique keywords, (2) filter overly common ones
    const countWord = (word: string) => {
      const lower = word.toLowerCase();
      if (!keywordCounts.has(lower)) {
        keywordCounts.set(lower, new Set());
      }
      keywordCounts.get(lower)!.add(entry.emoji);
    };

    // Track keywords separately - words in CLDR keyword lists only.
    // This is used to filter generic keywords like "body" that appear
    // as keywords for many different emojis.
    const countKeywordOnly = (word: string) => {
      const lower = word.toLowerCase();
      if (!keywordOnlyCounts.has(lower)) {
        keywordOnlyCounts.set(lower, new Set());
      }
      keywordOnlyCounts.get(lower)!.add(entry.emoji);
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
        countKeywordOnly(keyword);
      }
    }
  }

  // =========================================================================
  // PHASE 1b: Collect promotion candidates using complete frequency counts
  // =========================================================================
  // Problem: CLDR keywords like "dog" are useful for search but aren't in
  // the emoji's names array. We want to promote some keywords to names.
  //
  // However, naive promotion causes conflicts: "cake" appears in both
  // "fish cake" and "birthday cake" TTS names. Without coordination,
  // whichever emoji processes first claims "cake".
  //
  // Solution: Collect ALL potential promotions with metadata (TTS length,
  // exact match). Then in Phase 2, pick winners.
  // =========================================================================
  const promotionCandidates = new Map<string, PromotionCandidate[]>();

  // Skip generic keywords that appear as CLDR keywords for too many emojis.
  // Threshold chosen based on actual keyword frequency:
  // - party: 73 → maps to 🎉 ✓
  // - heart: 84 → would wrongly map to 💔 (not ❤️) due to semantic similarity
  // - food: 55 → maps to 🥫 ✓
  // - face: 162, hand: 138 → too generic, filtered
  // Threshold 75 keeps useful keywords while filtering problematic ones.
  const MAX_KEYWORD_FREQUENCY = 75;


  for (const entry of entries) {
    const baseEmoji = emojiByKey.get(
      normalizeEmojiKey(stripSkinTone(entry.emoji))
    );
    const entryKey = normalizeEmojiKey(entry.emoji);
    const baseKey = baseEmoji ? normalizeEmojiKey(baseEmoji) : null;

    // Skip skin tone variants (already processed in Phase 1a)
    if (baseEmoji && baseKey && baseKey !== entryKey) {
      continue;
    }

    // Skip internal categories (e.g., "internal:family") for keyword promotion.
    // These emojis are hidden from users in the app, so promoting their keywords
    // would cause words like "love" to map to 💏 (kiss) which is in internal:family,
    // instead of visible emojis like 🏩 (love hotel) or 💌 (love letter).
    const category = mapCategory(entry.group, entry.subgroup);
    if (isInternalCategory(category)) {
      continue; // Still counted words above, but don't promote keywords
    }

    const englishTts = getEnglishName(localeData["en"], entry.emoji) || "";
    const allKeywords = collectLocaleKeywords(localeData["en"], entry.emoji);

    // Collect all existing names for this emoji (for isNameMatch check)
    const existingNames = new Set<string>();
    for (const locale of LOCALES) {
      for (const name of collectLocaleNames(localeData[locale], entry.emoji)) {
        existingNames.add(name.toLowerCase());
      }
    }

    for (const keyword of allKeywords) {
      const lowerKeyword = keyword.toLowerCase();

      // Filter out overly generic keywords using pre-computed counts
      const keywordFreq = keywordOnlyCounts.get(lowerKeyword)?.size || 0;
      if (keywordFreq > MAX_KEYWORD_FREQUENCY) {
        continue;
      }

      // Check if keyword exactly matches one of emoji's existing names
      const isNameMatch = existingNames.has(lowerKeyword);

      // Compute semantic similarity between keyword and TTS name.
      // This allows keyword promotion even when words don't match exactly:
      // - "car" → 🚗 "automobile" (synonyms)
      // - "cherry" → 🍒 "cherries" (inflection)
      // - "clover" → 🍀 "four leaf clover" (phrase containing word)
      const synonymScore = semanticSimilarity(lowerKeyword, englishTts.toLowerCase());

      // Threshold tuned empirically:
      // - 0.45 accepts "clover" ↔ "four leaf clover" (0.49)
      // - Higher values miss valid matches
      // - Unique keywords (count=1) are promoted separately regardless
      const SYNONYM_THRESHOLD = 0.45;
      if (synonymScore >= SYNONYM_THRESHOLD) {
        if (!promotionCandidates.has(lowerKeyword)) {
          promotionCandidates.set(lowerKeyword, []);
        }
        promotionCandidates.get(lowerKeyword)!.push({
          emoji: entry.emoji,
          tts: englishTts,
          isNameMatch,
          synonymScore,
        });
      }
    }
  }

  // =========================================================================
  // PHASE 2: Pick one winner per keyword
  // =========================================================================
  // When multiple emojis compete for the same keyword, we need deterministic
  // tiebreakers. For example, "cake" appears in both "birthday cake" 🎂 and
  // "moon cake" 🥮 - which one should "cake" map to?
  //
  // Ranking criteria (in priority order):
  // 1. Name match wins - if keyword is already an emoji's name, that's exact
  // 2. Higher synonym score wins - semantic similarity as computed by embeddings
  // 3. Shorter TTS wins - "automobile" (11 chars) beats "police car" (10 chars)
  //
  // Note: We previously tried inflection matching (cherry ↔ cherries) and
  // modifier frequency ranking, but semantic similarity handles most cases
  // and keeps the code simpler.
  // =========================================================================
  const keywordWinners = new Map<string, string>();

  for (const [, candidates] of promotionCandidates) {
    candidates.sort((a, b) => {
      // 1. Name match wins (keyword is already one of emoji's names)
      if (a.isNameMatch && !b.isNameMatch) return -1;
      if (!a.isNameMatch && b.isNameMatch) return 1;

      // 2. Higher synonym score wins (car ↔ automobile via semantic similarity)
      if (a.synonymScore !== b.synonymScore) {
        return b.synonymScore - a.synonymScore; // Higher score wins
      }

      // 3. Shorter TTS wins (more specific emoji)
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
      const isUnique = keywordCounts.get(lowerKeyword)?.size === 1;
      if (isUnique) {
        names.add(keyword);
        lowerNames.add(lowerKeyword);
      }
    }

    // Keep keywords with count 2-10 for similarity detection.
    // Too common (>10) creates false positives; unique (=1) already promoted.
    const keywords = allKeywords.filter((k) => {
      const count = keywordCounts.get(k.toLowerCase())?.size;
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

  const result = buildEmojiDatabase(entries, localeData);
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
