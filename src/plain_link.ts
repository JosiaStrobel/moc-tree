/** Recognize wiki links that may show the linked note's title (no Obsidian dependency). */

/**
 * Link target of a plain wiki link `[[target]]`; null for links with display text,
 * heading or block subpaths, embeds and Markdown links.
 */
export function plain_link_target(original: string): string | null {
	const match = /^\[\[([^\]|#^[]+)\]\]$/.exec(original);
	const target = match?.[1]?.trim();
	return target ? target : null;
}

/** Link path of a wiki link value like `[[target|text]]` or `[[target#heading]]`; null otherwise. */
export function wiki_link_path(value: string): string | null {
	const match = /^\[\[([^\]|#^]*)(?:[#^][^\]|]*)?(?:\|[^\]]*)?\]\]$/.exec(value.trim());
	const path = match?.[1]?.trim();
	return path ? path : null;
}
