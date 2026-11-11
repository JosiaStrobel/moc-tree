/** Read title and structure list from parsed frontmatter (no Obsidian dependency). */

/** Minimal shape of a frontmatter link from the metadata cache. */
export interface FrontmatterLinkLike {
	key: string;
	link: string;
}

/** True if the frontmatter has the structure property, even when empty. */
export function has_structure(frontmatter: Record<string, unknown> | undefined, key: string): boolean {
	return frontmatter !== undefined && Object.prototype.hasOwnProperty.call(frontmatter, key);
}

/** The `title` as trimmed single-line text, or null if missing or empty. */
export function read_title(frontmatter: Record<string, unknown> | undefined): string | null {
	const value = frontmatter?.title;
	if (typeof value !== 'string' && typeof value !== 'number') return null;
	const title = String(value).trim();
	return title === '' ? null : title;
}

/** The `aliases` as trimmed non-empty texts; accepts a list or a single value. */
export function read_aliases(frontmatter: Record<string, unknown> | undefined): string[] {
	const value = frontmatter?.aliases;
	const list: unknown[] = Array.isArray(value) ? value : [value];
	return list
		.filter((entry): entry is string | number => typeof entry === 'string' || typeof entry === 'number')
		.map((entry) => String(entry).trim())
		.filter((entry) => entry !== '');
}

/** Index of a link inside the structure property: `key` → 0, `key.N` → N, otherwise null. */
function list_position(link_key: string, key: string): number | null {
	if (link_key === key) return 0;
	if (!link_key.startsWith(`${key}.`)) return null;
	const position = Number(link_key.slice(key.length + 1));
	return Number.isInteger(position) && position >= 0 ? position : null;
}

/** Link texts of the structure property in list order. */
export function structure_link_texts(links: readonly FrontmatterLinkLike[] | undefined, key: string): string[] {
	return (links ?? [])
		.map((entry) => ({ link: entry.link, position: list_position(entry.key, key) }))
		.filter((entry): entry is { link: string; position: number } => entry.position !== null)
		.sort((a, b) => a.position - b.position)
		.map((entry) => entry.link);
}
