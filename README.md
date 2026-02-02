# 3moji - Educational Learning Game for Kids

An interactive web application for early childhood education where parents input words (colors, shapes, objects) and kids identify the matching visual representation.

## Features

- **Dynamic Content**: Uses LLM to generate appropriate emojis for any word
- **Kid-Friendly UI**: Large touch targets, bright colors, no confusing menus
- **Audio Feedback**: Success/Error sounds and Text-to-Speech
- **PWA Support**: Installable on mobile devices for a native app experience

## How It Works

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Parent Input   │ ──► │   Game Screen   │ ──► │ Success Screen  │
│  (type a word)  │     │ (find the match)│     │   (celebrate!)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

1. **Parent** enters a word (like "red", "cat", or "triangle")
2. **App** generates 3 visual options (1 target + 2 distractors)
3. **Kid** taps to find the matching item
4. **Success** triggers confetti and "Play Again" option

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org) 16 (App Router)
- **UI**: React 19 + [Tailwind CSS](https://tailwindcss.com) v4
- **Validation**: [Zod](https://zod.dev) for runtime type safety
- **LLM**: Google Gemini 2.0 Flash Lite (via `ai` package)
- **Testing**: [Vitest](https://vitest.dev)

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/daohoangson/find-it-app.git
cd find-it-app

# Install dependencies
npm install
```

### Environment Variables

Create a `.env.local` file:

```bash
# Required for LLM fallback (optional if using only local emoji/color database)
AI_GATEWAY_API_KEY=your_api_key_here
```

> **Note**: The app works without an API key for common words thanks to the built-in emoji database (~3,900 emojis) and color dictionary (25+ colors with translations).

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Testing

```bash
npm test
```

### Build

```bash
npm run build
npm start
```

## Project Structure

```
├── app/
│   ├── api/generate/     # Content generation API route
│   ├── page.tsx          # Main app logic & state management
│   ├── layout.tsx        # Root layout with fonts
│   └── globals.css       # Tailwind config & theme
├── components/
│   ├── InputScreen.tsx   # Parent word input
│   ├── GameScreen.tsx    # Game play with options
│   ├── SuccessScreen.tsx # Victory celebration
│   ├── LoadingScreen.tsx # Loading indicator
│   └── Confetti.tsx      # Particle animation
├── lib/
│   ├── audio.ts          # Web Audio API sounds
│   ├── speech.ts         # Text-to-speech
│   ├── emoji-data.ts     # Emoji database by category (generated)
│   ├── game-content.ts   # Local content generation
│   ├── schema.ts         # Zod validation schemas
│   ├── shuffle.ts        # Fisher-Yates algorithm
│   └── suggestions.ts    # Random word suggestions
└── public/               # Static assets
```

## Content Generation Strategy

The app uses a two-tier content generation approach:

1. **Local First** (fast, free):
   - Color dictionary with 25+ CSS colors (English + translations)
   - Emoji database with ~3,900 emojis across 25 categories
   - Aliases for common words (e.g., "puppy" → 🐶)

2. **LLM Fallback** (when local match not found):
   - Uses Gemini 2.0 Flash Lite
   - Generates contextually appropriate distractors
   - Supports any language input

## Target Audience

- **Primary**: Pre-literate children (ages 2-5)
- **Secondary**: Parents/educators as facilitators

## License

MIT
