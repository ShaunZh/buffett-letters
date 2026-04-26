const STORAGE_KEY = "buffett-reading-position";
const MAX_ENTRIES = 20;

/**
 * Parses a raw JSON string from localStorage into a positions object.
 * Returns {} for null, undefined, or invalid/non-object JSON.
 */
export function loadReadingPositions(rawValue) {
  if (rawValue == null) return {};
  try {
    const parsed = JSON.parse(rawValue);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    return parsed;
  } catch {
    return {};
  }
}

/**
 * Returns a new positions object with the slug/blockId entry added or updated.
 * Does NOT mutate the input.
 */
export function saveReadingPosition(positions = {}, slug, blockId) {
  if (!slug || !blockId) return { ...positions };
  return { ...positions, [slug]: blockId };
}

/**
 * If entries exceed MAX_ENTRIES, removes the oldest (first keys).
 * Returns a pruned object. Does NOT mutate the input.
 */
export function prunePositions(positions = {}) {
  const keys = Object.keys(positions);
  if (keys.length <= MAX_ENTRIES) return { ...positions };
  const excess = keys.length - MAX_ENTRIES;
  const pruned = {};
  for (let i = excess; i < keys.length; i++) {
    pruned[keys[i]] = positions[keys[i]];
  }
  return pruned;
}

export { STORAGE_KEY, MAX_ENTRIES };

/**
 * Given an array of { id, rect: { top } } objects and a viewportTop number,
 * returns the id of the last block whose rect.top <= viewportTop.
 * If all blocks are below viewportTop, returns the first block's id.
 * Returns null for an empty array.
 */
export function findTopBlock(blocks, viewportTop) {
  if (!blocks || blocks.length === 0) return null;

  let candidate = blocks[0].id;
  for (const block of blocks) {
    if (block.rect.top <= viewportTop) {
      candidate = block.id;
    } else {
      break;
    }
  }
  return candidate;
}

/**
 * Sets up reading position persistence for a letter page.
 * On load: restores scroll position to the last saved block.
 * On scroll: debounced save of the current top block to localStorage.
 */
export function setupReadingPosition() {
  const article = document.querySelector("[data-letter-page]");
  if (!article || article.dataset.readingPositionInitialized === "true") return;
  article.dataset.readingPositionInitialized = "true";

  const slug = article.getAttribute("data-letter-slug");
  if (!slug) return;

  // Restore position on load
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const positions = loadReadingPositions(raw);
    const savedBlockId = positions[slug];
    if (savedBlockId && /^[a-zA-Z0-9_-]+$/.test(savedBlockId)) {
      const block = document.querySelector(`[data-block-id="${savedBlockId}"]`);
      if (block) {
        block.scrollIntoView({ block: "start" });
      }
    }
  } catch {
    // localStorage unavailable (private mode, quota, etc.)
  }

  // Debounced scroll handler — saves after user stops scrolling for 3s
  let debounceTimer = null;
  window.addEventListener("scroll", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;

      const blocks = Array.from(
        document.querySelectorAll("[data-block-id]"),
        (el) => ({
          id: el.getAttribute("data-block-id"),
          rect: el.getBoundingClientRect(),
        }),
      );

      const topBlockId = findTopBlock(blocks, 0);
      if (topBlockId) {
        try {
          const currentRaw = localStorage.getItem(STORAGE_KEY);
          let currentPositions = loadReadingPositions(currentRaw);
          currentPositions = saveReadingPosition(currentPositions, slug, topBlockId);
          currentPositions = prunePositions(currentPositions);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(currentPositions));
        } catch {
          // localStorage unavailable
        }
      }
    }, 3000);
  });
}