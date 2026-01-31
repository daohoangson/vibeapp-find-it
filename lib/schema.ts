import { z } from "zod";

export const GameContentSchema = z.object({
  type: z.enum(["color", "emoji"]),
  targetValue: z.string(),
  distractors: z
    .array(z.string())
    .min(2)
    .transform((array) => array.slice(0, 2)),
});

export type GameContent = z.infer<typeof GameContentSchema>;
