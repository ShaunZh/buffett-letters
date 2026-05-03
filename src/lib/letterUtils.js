export function filterPublishedLetters(entries) {
  return entries.filter((entry) => !entry.data.draft);
}

export function sortLettersByDateDesc(entries) {
  return [...entries].sort((left, right) => right.data.date.valueOf() - left.data.date.valueOf());
}

export function getLettersForTag(entries, tag) {
  return sortLettersByDateDesc(
    filterPublishedLetters(entries).filter((entry) => entry.data.tags.includes(tag)),
  );
}

export function getAllTags(entries) {
  return [...new Set(filterPublishedLetters(entries).flatMap((entry) => entry.data.tags))].sort();
}

export function getLetterNavItems(entries, options = {}) {
  const type = typeof options === "string" ? options : options.type;
  const hrefBase = typeof options === "object" && options.hrefBase ? options.hrefBase.replace(/\/$/, "") : "/letters";
  const filteredEntries = filterPublishedLetters(entries).filter((entry) => !type || entry.data.type === type);

  return sortLettersByDateDesc(filteredEntries).map((entry) => ({
    href: `${hrefBase}/${entry.slug}/`,
    year: Number.parseInt(entry.slug.match(/^(\d{4})/)?.[1] ?? String(entry.data.date.getFullYear()), 10),
    label: entry.data.title_zh,
    slug: entry.slug,
  }));
}
