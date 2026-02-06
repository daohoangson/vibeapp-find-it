import type { TopicLevel } from "./schema";

export interface LevelInfo {
  level: TopicLevel;
  name: string;
  ageRange: string;
  focus: string;
}

export const LEVELS: Record<TopicLevel, LevelInfo> = {
  1: {
    level: 1,
    name: "Explorer",
    ageRange: "1-2 years",
    focus: "Naming concrete, everyday objects",
  },
  2: {
    level: 2,
    name: "Discoverer",
    ageRange: "3-5 years",
    focus: "Categorization, basic logic, emotions",
  },
  3: {
    level: 3,
    name: "Scholar",
    ageRange: ">5 years",
    focus: "Complex symbols, global awareness, abstract",
  },
};

export function getLevelInfo(level: TopicLevel): LevelInfo {
  return LEVELS[level];
}
