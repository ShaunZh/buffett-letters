# Reading Position Persistence Design

## Goal

When a user reopens a previously read letter, automatically scroll to the last paragraph they were viewing.

## Data Structure

**localStorage key:** `buffett-reading-position`

**Format:** flat object keyed by letter slug, values are block IDs:

```json
{
  "2024-letter": "p5",
  "2023-letter": "p12"
}
```

Block IDs (e.g. `p5`) match the existing `data-block-id` attribute on `<section>` elements rendered by `LetterBlock.astro`.

## Implementation

### New module: `src/lib/readingPosition.js`

Exports `setupReadingPosition()` which:

**Save position:**
- Listen to `scroll` event with 3-second debounce (user confirmed: precision is not critical)
- Find the block whose top edge is closest to the viewport top by iterating `[data-block-id]` elements
- Write the current slug + block ID to localStorage

**Restore position:**
- On page load, read localStorage for the current letter slug
- If a saved block ID exists, find `[data-block-id="${blockId}"]` and call `scrollIntoView({ block: "start" })` without smooth animation
- If the saved block ID no longer exists in the page (content changed), silently ignore

**Cleanup:**
- Keep at most 20 entries; when exceeded, delete the oldest (by insertion order — JSON object keys preserve order in modern engines)

### Integration: `src/pages/letters/[slug].astro`

Add a client-side script block:

```astro
<script>
  import { setupReadingPosition } from "../lib/readingPosition.js";
  setupReadingPosition();
</script>
```

Same pattern as existing `LetterNotes.astro` integration.

### Getting the current slug

The page already has `[data-letter-slug]` on the `<article>` element. Read it from the DOM inside `setupReadingPosition()`.

## Out of Scope

- "Back to top" button
- Reading progress indicator on LetterCard
- Position tracking per language mode (same block ID works across modes)