import { z } from "zod";

export const GameContentSchema = z.object({
  type: z.enum(["color", "emoji"]),
  targetValue: z.string(),
  distractors: z.tuple([z.string(), z.string()]),
});

export type GameContent = z.infer<typeof GameContentSchema>;
