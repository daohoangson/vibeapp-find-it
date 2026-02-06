import { z } from "zod";

export const TopicLevelSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);
export type TopicLevel = z.infer<typeof TopicLevelSchema>;

export const TopicSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  learningGoals: z.array(z.string()),
  icon: z.string(),
  level: TopicLevelSchema,
  words: z.array(z.string()),
});

export type Topic = z.infer<typeof TopicSchema>;
