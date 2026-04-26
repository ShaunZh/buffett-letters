const STORAGE_KEY = "buffett-letter-notes";
const NOTE_COLORS = ["amber", "mint", "sky", "plum", "rose"];

function normalizeText(value = "") {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeColor(color = "") {
  return NOTE_COLORS.includes(color) ? color : "amber";
}

export function createNoteRecord({
  letterSlug,
  blockId,
  language,
  selectedText,
  note = "",
  color = "amber",
  startOffset,
  endOffset,
  id = crypto.randomUUID(),
  createdAt = new Date().toISOString(),
}) {
  return {
    id,
    letterSlug,
    blockId,
    language,
    selectedText: normalizeText(selectedText),
    note: note.trim(),
    color: normalizeColor(color),
    startOffset,
    endOffset,
    createdAt,
  };
}

export function isValidNoteRecord(note) {
  return Boolean(
    note &&
      note.id &&
      note.letterSlug &&
      note.blockId &&
      (note.language === "en" || note.language === "zh") &&
      NOTE_COLORS.includes(note.color) &&
      typeof note.selectedText === "string" &&
      note.selectedText &&
      Number.isInteger(note.startOffset) &&
      Number.isInteger(note.endOffset) &&
      note.endOffset > note.startOffset,
  );
}

function hydrateStoredNote(note) {
  if (!note || typeof note !== "object") {
    return null;
  }

  return createNoteRecord({
    id: note.id,
    createdAt: note.createdAt,
    letterSlug: note.letterSlug,
    blockId: note.blockId,
    language: note.language,
    selectedText: note.selectedText,
    note: note.note,
    color: note.color,
    startOffset: note.startOffset,
    endOffset: note.endOffset,
  });
}

export function parseStoredNotes(rawValue) {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed.map(hydrateStoredNote).filter(isValidNoteRecord) : [];
  } catch {
    return [];
  }
}

export function serializeNotes(notes = []) {
  return JSON.stringify(notes.filter(isValidNoteRecord));
}

export function getNotesForLetter(notes = [], letterSlug) {
  return notes
    .filter((note) => note.letterSlug === letterSlug)
    .sort((left, right) => {
      if (left.blockId !== right.blockId) {
        return left.blockId.localeCompare(right.blockId, undefined, { numeric: true });
      }

      if (left.language !== right.language) {
        return left.language.localeCompare(right.language);
      }

      return left.startOffset - right.startOffset;
    });
}

export function upsertNote(notes = [], nextNote) {
  const filtered = notes.filter(
    (note) =>
      note.id !== nextNote.id &&
      !(
        note.letterSlug === nextNote.letterSlug &&
        note.blockId === nextNote.blockId &&
        note.language === nextNote.language &&
        note.startOffset === nextNote.startOffset &&
        note.endOffset === nextNote.endOffset
      ),
  );
  filtered.push(nextNote);
  return filtered;
}

export function removeNote(notes = [], noteId) {
  return notes.filter((note) => note.id !== noteId);
}

export { NOTE_COLORS, STORAGE_KEY };
