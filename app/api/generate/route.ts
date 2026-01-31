import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { NextResponse } from "next/server";
import { GameContentSchema } from "@/lib/schema";

const SYSTEM_PROMPT = `You are a helpful assistant for a children's educational game called "Find It!".
A parent has entered a word, and you need to generate game content for their child to find.

Rules:
1. If the word is a COLOR (like "red", "blue", "verde", "rot", etc. in any language):
   - Set type to "color"
   - Set targetValue to a valid CSS color name (e.g., "red", "blue", "green")
   - Set distractors to 2 OTHER distinct CSS color names that are visually different

2. If the word is ANYTHING ELSE (animal, shape, object, food, etc.):
   - Set type to "emoji"
   - Set targetValue to a single emoji representing the word
   - Set distractors to 2 OTHER related but different emojis from the same category

Important:
- Accept input in ANY language and translate to appropriate content
- Keep emojis simple and recognizable for young children (ages 2-5)
- Make sure all 3 options (target + 2 distractors) are visually distinct
- For colors, use only basic CSS color names children can see clearly`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const word = body.word;

    if (!word || typeof word !== "string" || !word.trim()) {
      return NextResponse.json({ error: "Word is required" }, { status: 400 });
    }

    const { object } = await generateObject({
      model: anthropic("claude-haiku-4-5-20250514"),
      schema: GameContentSchema,
      system: SYSTEM_PROMPT,
      prompt: `Generate game content for the word: "${word.trim()}"`,
    });

    return NextResponse.json(object);
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 },
    );
  }
}
