#!/usr/bin/env node
/**
 * Generation recap:
 * - Fetch emoji list from Unicode emoji-test.txt (fully-qualified + component).
 * - Fetch English names/keywords from CLDR annotations + derived annotations.
 * - Primary name = CLDR tts fallback to emoji-test name.
 * - Similarity aliases come from tokenized names + subgroup tags, filtered by stopwords.
 * - Search keywords include all CLDR/emoji-test terms (names stay separate).
 * - Category mapping follows emoji-test group/subgroup buckets.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const EMOJI_TEST_URL =
  process.env.EMOJI_TEST_URL ??
  "https://www.unicode.org/Public/emoji/latest/emoji-test.txt";
const CLDR_JSON_BASE_URL =
  process.env.CLDR_JSON_BASE_URL ??
  "https://raw.githubusercontent.com/unicode-org/cldr-json/main/cldr-json";
const ANNOTATIONS_URL = `${CLDR_JSON_BASE_URL}/cldr-annotations-full/annotations/en/annotations.json`;
const ANNOTATIONS_DERIVED_URL = `${CLDR_JSON_BASE_URL}/cldr-annotations-derived-full/annotationsDerived/en/annotations.json`;

const OUTPUT_PATH = path.join(repoRoot, "lib", "emoji-data.generated.ts");

const INCLUDE_STATUSES = new Set(["fully-qualified", "component"]);

const SIMILARITY_STOPWORDS = new Set([
  "a",
  "an",
  "adult",
  "and",
  "animal",
  "animals",
  "baby",
  "black",
  "blue",
  "body",
  "boy",
  "brown",
  "child",
  "dark",
  "face",
  "faces",
  "family",
  "female",
  "flag",
  "flags",
  "gesture",
  "gestures",
  "girl",
  "gray",
  "grey",
  "green",
  "hand",
  "hands",
  "human",
  "in",
  "left",
  "light",
  "little",
  "medium",
  "male",
  "man",
  "men",
  "new",
  "object",
  "objects",
  "of",
  "on",
  "orange",
  "or",
  "people",
  "person",
  "pet",
  "pets",
  "pink",
  "place",
  "places",
  "plant",
  "plants",
  "purple",
  "red",
  "right",
  "small",
  "sign",
  "signs",
  "skin",
  "skin tone",
  "symbol",
  "symbols",
  "thing",
  "things",
  "tone",
  "tones",
  "up",
  "wave",
  "white",
  "woman",
  "women",
  "with",
  "yellow",
]);

const EXTRA_SIMILARITY_TAGS_BY_SUBGROUP = new Map([
  ["plant-flower", ["flower"]],
  ["time", ["clock"]],
  ["face-cat", ["cat"]],
]);

function fetchText(url) {
  try {
    return execFileSync("curl", ["-fsSL", url], { encoding: "utf8" });
  } catch (error) {
    const message = error?.message || error;
    throw new Error(`Failed to fetch ${url}: ${message}`);
  }
}

function normalizeEmoji(emoji) {
  return emoji.replace(/[\uFE0E\uFE0F]/g, "");
}

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/^\s+|\s+$/g, "");
}

function tokenizeName(name) {
  return normalizeName(name)
    .replace(/o[’']?clock/g, "clock")
    .split(/[^a-z0-9]+/g)
    .filter(Boolean);
}

function uniquePreserveOrder(values) {
  const seen = new Set();
  const result = [];
  for (const value of values) {
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}

function parseEmojiTest(text) {
  const entries = [];
  let group = null;
  let subgroup = null;

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

    const emoji = match[1];
    const version = match[2];
    const name = match[3];

    entries.push({ emoji, version, name, group, subgroup, status });
  }

  return entries;
}

function parseAnnotations(jsonText, rootKey) {
  const parsed = JSON.parse(jsonText);
  const root = parsed[rootKey];
  if (!root || !root.annotations) return new Map();

  const result = new Map();
  for (const [emoji, data] of Object.entries(root.annotations)) {
    const normalizedEmoji = normalizeEmoji(emoji);
    const tts = Array.isArray(data.tts) ? data.tts[0] : data.tts;
    const keywords = Array.isArray(data.default) ? data.default : [];

    const entry = {
      tts: tts ? normalizeName(tts) : null,
      keywords: keywords.map(normalizeName).filter(Boolean),
    };

    result.set(emoji, entry);
    if (!result.has(normalizedEmoji)) {
      result.set(normalizedEmoji, entry);
    }
  }

  return result;
}

function mapCategory(group = "", subgroup = "") {
  const g = group.toLowerCase();
  const sg = subgroup.toLowerCase();

  if (g === "smileys & emotion") return "faces";

  if (g === "people & body") {
    if (sg.startsWith("person-fantasy")) return "fantasy";
    if (sg.startsWith("person-sport")) return "sports";
    if (sg.startsWith("person-activity")) return "sports";
    return "people";
  }

  if (g === "animals & nature") {
    if (sg.startsWith("animal-")) return "animals";
    if (sg.startsWith("plant-")) return "nature";
    if (sg === "sky & weather") return "weather";
    return "nature";
  }

  if (g === "food & drink") {
    if (sg === "food-fruit") return "fruits";
    if (sg === "food-vegetable") return "vegetables";
    if (sg === "drink") return "drinks";
    if (sg === "dishware") return "objects";
    return "food";
  }

  if (g === "travel & places") {
    if (sg.startsWith("transport-")) return "vehicles";
    if (sg.startsWith("place-") || sg === "hotel") return "places";
    return "places";
  }

  if (g === "activities") {
    if (sg === "sport") return "sports";
    if (sg === "game") return "games";
    if (sg === "arts & crafts") return "arts";
    if (sg === "event") return "celebration";
    if (sg === "award-medal") return "objects";
    return "objects";
  }

  if (g === "objects") {
    if (sg === "clothing") return "clothing";
    if (sg === "medical" || sg === "science") return "medical";
    if (sg === "tool") return "tools";
    if (sg === "sound" || sg === "music" || sg === "musical-instrument") {
      return "music";
    }
    if (sg === "book-paper" || sg === "office" || sg === "writing") {
      return "school";
    }
    if (sg === "time") return "time";
    return "objects";
  }

  if (g === "symbols") {
    if (sg === "time") return "time";
    if (sg === "geometric") return "shapes";
    return "symbols";
  }

  if (g === "flags") return "flags";
  if (g === "component") return "components";

  return "objects";
}

function buildEmojiDatabase(emojiEntries, annotations, derivedAnnotations) {
  const categories = new Map();
  const seenEmoji = new Set();

  for (const entry of emojiEntries) {
    if (seenEmoji.has(entry.emoji)) continue;
    seenEmoji.add(entry.emoji);

    const annotation = annotations.get(entry.emoji) || {};
    const derived = derivedAnnotations.get(entry.emoji) || {};

    const officialName = normalizeName(entry.name);
    const primaryName = annotation.tts || derived.tts || officialName;

    const keywordList = uniquePreserveOrder([
      officialName,
      primaryName,
      ...(annotation.keywords || []),
      ...(derived.keywords || []),
    ]).filter(Boolean);

    const extraSimilarityTags =
      EXTRA_SIMILARITY_TAGS_BY_SUBGROUP.get(
        (entry.subgroup || "").toLowerCase(),
      ) || [];
    const similarityTokens = uniquePreserveOrder([
      ...tokenizeName(primaryName),
      ...tokenizeName(officialName),
      ...extraSimilarityTags,
    ]);
    const similarityAliases = similarityTokens.filter(
      (token) => !SIMILARITY_STOPWORDS.has(token),
    );

    const searchKeywords = [...keywordList];

    if (primaryName.startsWith("flag: ")) {
      searchKeywords.push(primaryName.replace(/^flag:\s*/, ""));
    }

    if (primaryName.startsWith("keycap: ")) {
      searchKeywords.push(primaryName.replace(/^keycap:\s*/, ""));
    }

    const item = {
      emoji: entry.emoji,
      names: uniquePreserveOrder([
        primaryName,
        officialName,
        ...similarityAliases,
      ]),
      keywords: uniquePreserveOrder(searchKeywords),
    };

    const category = mapCategory(entry.group, entry.subgroup);
    if (!categories.has(category)) {
      categories.set(category, []);
    }
    categories.get(category).push(item);
  }

  return categories;
}

function formatEmojiDatabase(categories) {
  return [...categories.entries()].map(([category, items]) => ({
    category,
    items,
  }));
}

function writeOutput(database) {
  const header =
    `/**\n` +
    ` * Emoji database with categories for generating game content without LLM.\n` +
    ` * Generated by scripts/generate-emoji-data.mjs.\n` +
    ` * Sources:\n` +
    ` * - Unicode emoji-test.txt (${EMOJI_TEST_URL})\n` +
    ` * - Unicode CLDR annotations (${CLDR_JSON_BASE_URL})\n` +
    ` */\n`;

  const body = `export const EMOJI_DATABASE = ${JSON.stringify(database, null, 2)};\n`;

  fs.writeFileSync(OUTPUT_PATH, header + "\n" + body, "utf8");
}

function main() {
  const emojiTestText = fetchText(EMOJI_TEST_URL);
  const annotationsText = fetchText(ANNOTATIONS_URL);
  const derivedText = fetchText(ANNOTATIONS_DERIVED_URL);

  const emojiEntries = parseEmojiTest(emojiTestText);
  const annotations = parseAnnotations(annotationsText, "annotations");
  const derivedAnnotations = parseAnnotations(
    derivedText,
    "annotationsDerived",
  );

  const categories = buildEmojiDatabase(
    emojiEntries,
    annotations,
    derivedAnnotations,
  );
  const database = formatEmojiDatabase(categories);

  writeOutput(database);

  const emojiCount = emojiEntries.length;
  const categoryCount = database.length;
  console.log(
    `Generated ${OUTPUT_PATH} with ${emojiCount} emojis across ${categoryCount} categories.`,
  );
}

main();
