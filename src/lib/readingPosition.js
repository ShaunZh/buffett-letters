export const STORAGE_KEY = "buffett-reading-position";
export const MAX_ENTRIES = 20;

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
export function saveReadingPosition(positions, slug, blockId) {
  return { ...positions, [slug]: blockId };
}

/**
 * If entries exceed MAX_ENTRIES, removes the oldest (first keys).
 * Returns a pruned object. Does NOT mutate the input.
 */
export function prunePositions(positions) {
  const keys = Object.keys(positions);
  if (keys.length <= MAX_ENTRIES) return { ...positions };
  const excess = keys.length - MAX_ENTRIES;
  const pruned = {};
  for (let i = excess; i < keys.length; i++) {
    pruned[keys[i]] = positions[keys[i]];
  }
  return pruned;
}