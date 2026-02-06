# Find It! - Topics Pages

## High-Level Feature Specification

### Overview

Introduce topic-based landing pages that group curated, age-appropriate words into stable categories. Each topic page serves as a discoverable entry point for parents, provides meaningful descriptive content for indexing, and can start a self-contained, multi-turn game session without relying on the LLM.

### Problem

The current experience relies on direct input and a dynamic `/find/:word` route. This creates limited guidance for parents, weak topical structure for search engines and AI systems, and an inconsistent onboarding flow. The site lacks stable, content-rich pages that describe the educational value of specific learning areas.

### Pain Points

- Parents must invent words, which slows onboarding and creates choice fatigue.
- Dynamic, near-infinite routes are not ideal for indexing or topical authority.
- LLM fallback is unsuitable for fast, deterministic multi-turn play.
- There is no explicit age targeting or curriculum-style structure.

### Analysis Summary

- Topic pages provide stable URLs with high-quality, indexable content, which is critical for search engines and AI crawlers.
- In-page gameplay is feasible if the session is fully local and precomputed; LLM involvement should remain out of the critical path.
- Consistency across topic pages improves discoverability and internal linking, while light customization preserves relevance.
- The primary SEO value should concentrate on topic pages rather than the ad-hoc `/find/:word` experience.

### Approach Chosen

- Create first-class topic pages as the primary entry points for curated play.
- Each topic page includes:
  - A consistent layout with topic-specific descriptive content and learning goals.
  - A curated word list for quick-start play.
  - A local-only, precomputed 10-turn session run entirely on the client.
- Update the home page to surface and link into topic pages as the primary navigation path.
- Generate a sitemap to support submissions and ensure topic pages are discoverable by crawlers.
- Keep `/find/:word` for ad-hoc use, but ensure topic pages are the canonical, indexable surfaces.
- Emphasize deterministic, fast sessions; no LLM usage for topic-driven sequences.

### Non-Goals

- Building a full curriculum system or teacher dashboard.
- Generating topic content via LLM in real time.
- Indexing every `/find/:word` route.
