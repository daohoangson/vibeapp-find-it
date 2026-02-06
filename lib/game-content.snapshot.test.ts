import { describe, it, expect, vi } from "vitest";

import { deterministicShuffle } from "./test-utils/deterministic-shuffle";

// Keep distractor order deterministic for snapshot review.
vi.mock("./shuffle", () => ({
  shuffle: <T>(items: T[]) => deterministicShuffle(items),
}));

import { generateLocalContent } from "./game-content";

const WORDS = [
  // =============================================================================
  // Common nouns from Google 10k English (top 2000) - for coverage testing
  // =============================================================================

  // Animals (from 10k list + extras)
  "dog", // 1047
  "cat", // 1760
  "fish", // 1563
  "horse", // 1401
  "animal", // 1294
  "pet", // 1803
  "cow",
  "lion",
  "elephant",
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

  // People & family (from 10k list)
  "person", // 532
  "people", // 105
  "man", // 413
  "woman", // 1135
  "child", // 655
  "children", // 354
  "baby", // 669
  "boy", // 1393
  "girl", // 902
  "mother", // 1430
  "father", // 1692
  "wife", // 1750
  "son", // 1417
  "family", // 262
  "friend", // 503
  "friends", // 715
  "guy", // 1814
  "king", // 1012
  "player", // 863
  "artist", // 1189
  "manager", // 919
  "officer", // 1697
  "driver", // 1698
  "worker", // 1716
  "student", // 542
  "teacher", // 1712

  // Body parts (from 10k list)
  "body", // 570
  "hand", // 644
  "hands", // 1675
  "head", // 692
  "face", // 973
  "eye", // 1566
  "eyes", // 1714
  "heart", // 889
  "blood", // 1323
  "skin", // 1509
  "hair", // 1357
  "foot",
  "ear",
  "nose",
  "mouth",
  "tooth",

  // Food & drinks (from 10k list + extras)
  "food", // 418
  "water", // 334
  "coffee", // 1942
  "wine", // 1399
  "ice", // 1960
  "egg",
  "milk",
  "juice",
  "pizza",
  "ice cream",
  "cake",
  "cookie",
  "bread",
  "cheese",
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

  // Fruits & vegetables
  "apple", // 1643
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

  // Nature & weather (from 10k list)
  "sun", // 645
  "star", // 639
  "moon",
  "fire", // 960
  "air", // 478
  "light", // 613
  "tree", // 1369
  "plant", // 1549
  "earth", // 1333
  "world", // 119
  "nature", // 1002
  "weather", // 771
  "rain",
  "snow",
  "wind", // 1899
  "cloud",
  "sky",
  "sea", // 1320
  "river", // 1027
  "lake", // 940
  "ocean",
  "island", // 781
  "beach", // 757
  "mountain", // 1521
  "forest", // 1879
  "garden", // 662
  "wood", // 1623
  "stone", // 1922
  "rock", // 836
  "land", // 773
  "ground", // 1346
  "wave",
  "rainbow",
  "snowman",

  // Buildings & places (from 10k list)
  "home", // 33
  "house", // 297
  "hotel", // 211
  "school", // 165
  "office", // 241
  "church", // 950
  "hospital", // 1345
  "university", // 193
  "college", // 409
  "library", // 471
  "museum", // 1744
  "restaurant", // 1704
  "store", // 219
  "shop", // 343
  "market", // 470
  "bank", // 875
  "station", // 1307
  "airport", // 1187
  "park", // 549
  "city", // 139
  "town", // 888
  "village", // 1933
  "country", // 396
  "state", // 111
  "street", // 523
  "road", // 590
  "building", // 606
  "room", // 433
  "door", // 1449
  "window", // 777
  "floor", // 1533
  "wall", // 1374
  "kitchen", // 1339
  "bed", // 1260
  "pool", // 1554

  // Vehicles & transport (from 10k list + extras)
  "car", // 244
  "bus", // 1982
  "ship", // 1348
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

  // Objects & things (from 10k list)
  "phone", // 255
  "computer", // 312
  "camera", // 900
  "video", // 156
  "tv", // 483
  "radio", // 693
  "screen", // 1049
  "book", // 176
  "paper", // 577
  "card", // 414
  "letter", // 1194
  "box", // 451
  "bag", // 1995
  "cup", // 1822
  "glass", // 1279
  "bottle",
  "plate",
  "table", // 464
  "chair", // 1990
  "clock",
  "watch", // 871
  "key", // 569
  "ring", // 1517
  "ball", // 1887
  "game", // 305
  "toy",
  "gift", // 591
  "money", // 391
  "dollar",
  "tool", // 1247
  "equipment", // 540
  "machine", // 1153
  "engine", // 1034
  "battery", // 1606
  "lamp",
  "candle",

  // Clothing & accessories (from 10k list)
  "shoes", // 999
  "shirt",
  "dress",
  "hat",
  "jacket",
  "coat",
  "pants",
  "jeans",
  "fashion", // 1873

  // Materials (from 10k list)
  "gold", // 740
  "silver", // 1087
  "metal", // 1466
  "steel", // 1669
  "wood", // 1623
  "leather", // 1913
  "plastic",
  "glass", // 1279
  "oil", // 981
  "gas", // 1119

  // Colors (from 10k list)
  "black", // 271
  "white", // 348
  "red", // 554
  "blue", // 618
  "green", // 733
  "yellow", // 983
  "pink", // 1961
  "brown", // 1268
  "orange",
  "purple",
  "gray",
  // Spanish colors
  "rojo",
  "azul",
  "verde",

  // Shapes & symbols
  "circle",
  "square", // 1834
  "triangle",
  "diamond",
  "rectangle",
  "oval",
  "hexagon",
  "octagon",

  // Time & calendar (from 10k list)
  "time", // 50
  "day", // 113
  "week", // 458
  "month", // 637
  "year", // 112
  "hour", // 1118
  "minute", // 1981
  "night", // 594
  "morning", // 1544
  "summer", // 1201
  "winter", // 1604
  "spring", // 1249
  "fall", // 1232
  "holiday", // 961
  "christmas", // 1170
  "birthday",
  "halloween",
  "wedding", // 1343

  // Emotions & states (from 10k list + extras)
  "love", // 370
  "happy", // 1280
  "fun", // 731
  "peace", // 1720
  "hope", // 1086
  "death", // 967
  "pain", // 1938
  "sad",
  "angry",
  "scared",
  "surprised",
  "sleepy",
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

  // Countries & flags (from 10k list)
  "United States",
  "United Kingdom",
  "America", // 572
  "Canada", // 430
  "Australia", // 702
  "Japan", // 996
  "China", // 629
  "India", // 920
  "Mexico", // 1296
  "France", // 778
  "Germany", // 869
  "Italy", // 1355
  "Spain", // 1600
  "England", // 1171
  "Ireland", // 1446

  // Sports & games (from 10k list)
  "sport", // 1291
  "sports", // 296
  "football", // 1474
  "golf", // 908
  "basketball",
  "baseball",
  "soccer",
  "tennis",
  "volleyball",
  "swimming",
  "running",
  "fishing", // 1991
  "dance", // 1622

  // Professions (from 10k list + extras)
  "doctor",
  "health worker",
  "police officer",
  "firefighter",
  "pilot",
  "cook",
  "artist", // 1189
  "manager", // 919
  "president", // 688
  "director", // 755
  "author", // 420
  "agent", // 1441
  "judge",
  "lawyer",
  "nurse",
  "scientist",
  "farmer",

  // Celebrations & events
  "party", // 538
  "event", // 624
  "show", // 268
  "movie", // 490
  "film", // 677
  "music", // 129
  "song", // 1225
  "news", // 59
  "art", // 338
  "photo", // 304
  "picture", // 631
  "balloon",
  "fireworks",
  "confetti",

  // Communication (from 10k list)
  "email", // 115
  "message", // 149
  "call", // 374
  "letter", // 1194
  "word", // 810
  "question", // 592

  // =============================================================================
  // Compound word tests (for modifier frequency debugging)
  // =============================================================================
  "soccer ball",
  "basketball",
  "football",
  "baseball",
  "volleyball",
  "tennis ball",
  "golf ball",
  "crystal ball",
  "rice ball",
  "beach ball",
  "cooked rice",
  "fried rice",
  "birthday cake",
  "moon cake",
  "fish cake",
  "police car",
  "fire truck",
  "race car",
  "tram car",
  "love hotel",
  "red heart",
  "broken heart",
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
