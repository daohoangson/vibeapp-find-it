import { describe, it, expect, vi } from "vitest";

import { deterministicShuffle } from "./test-utils/deterministic-shuffle";

// Keep distractor order deterministic for snapshot review.
vi.mock("./shuffle", () => ({
  shuffle: <T>(items: T[]) => deterministicShuffle(items),
}));

import { generateLocalContent } from "./game-content";

const WORDS = [
  // Animals & pets
  "dog",
  "cat",
  "cow",
  "horse",
  "lion",
  "elephant",
  "fish",
  "duck",
  "rabbit",
  "monkey",
  "pig",
  "sheep",
  "ram",
  "ewe",
  "goat",
  "chicken",
  "rooster",
  "bird",
  "frog",
  "turtle",
  "snake",
  "bear",
  "tiger",
  "zebra",
  "giraffe",
  "dolphin",
  "shark",
  "octopus",
  "butterfly",
  "bee",
  "ladybug",

  // Foods & drinks
  "pizza",
  "ice cream",
  "cake",
  "cookie",
  "bread",
  "cheese",
  "egg",
  "hamburger",
  "hot dog",
  "fries",
  "doughnut",
  "donut",
  "noodle",
  "rice",
  "soup",
  "salad",
  "sandwich",
  "milk",
  "water",
  "juice",

  // Fruits & vegetables
  "apple",
  "banana",
  "orange",
  "grapes",
  "watermelon",
  "cherry",
  "strawberry",
  "lemon",
  "pear",
  "peach",
  "carrot",
  "corn",
  "potato",
  "tomato",
  "broccoli",
  "cucumber",

  // Vehicles & transport
  "car",
  "bus",
  "train",
  "truck",
  "plane",
  "boat",
  "bicycle",
  "helicopter",
  "airplane",
  "motorcycle",
  "scooter",
  "tractor",
  "ambulance",
  "fire truck",
  "police car",
  "rocket",
  "subway",

  // Body parts
  "hand",
  "foot",
  "eye",
  "ear",
  "nose",
  "mouth",
  "tooth",

  // Colors (English + translations)
  "red",
  "blue",
  "green",
  "yellow",
  "orange",
  "purple",
  "rojo",
  "azul",
  "verde",
  "pink",
  "brown",
  "black",
  "white",
  "gray",

  // Shapes / symbols
  "circle",
  "square",
  "triangle",
  "star",
  "heart",
  "diamond",
  "rectangle",
  "oval",
  "hexagon",
  "octagon",

  // Emotions & synonyms
  "happy",
  "sad",
  "angry",
  "scared",
  "surprised",
  "sleepy",
  "love",
  "excited",
  "worried",
  "crying",
  "smile",
  "smiling face",
  "cry",
  "crying face",
  "loudly crying face",
  "fearful face",
  "worried face",
  "partying face",
  "star-struck",

  // Flags / places
  "United States",
  "United Kingdom",
  "Japan",
  "Australia",

  // Professions & people
  "doctor",
  "health worker",
  "police officer",
  "firefighter",
  "teacher",
  "pilot",
  "cook",

  // Celebrations & misc
  "balloon",
  "gift",
  "party",
  "birthday",
  "christmas",
  "halloween",
  "fireworks",
  "snowman",
  "rainbow",
  "ball",
  "book",
  "toy",
  "clock",
  "key",
];

const summarize = (word: string) => {
  const content = generateLocalContent(word);
  if (!content) return `${word} -> null`;
  return `${word} -> ${content.type}:${content.targetValue} | ${content.distractors.join(", ")}`;
};

describe("generateLocalContent snapshot", () => {
  it("summarizes words deterministically", () => {
    const summary = WORDS.map((word) => summarize(word));
    expect(summary).toMatchSnapshot();
  });
});
