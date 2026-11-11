/** Title proposals for notes without `title` (no Obsidian dependency). */

/** Minimal shape of a heading from the metadata cache. */
export interface HeadingLike {
	heading: string;
	level: number;
}

/** Heading text without Markdown syntax: link targets, emphasis, code marks, extra spaces. */
export function plain_heading(text: string): string {
	return text
		.replace(/!?\[\[([^\]|]*)\|([^\]]*)\]\]/g, '$2')
		.replace(/!?\[\[([^\]]*)\]\]/g, '$1')
		.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/(\*\*|__|\*|_|~~|==|`)(.+?)\1/g, '$2')
		.replace(/\s+/g, ' ')
		.trim();
}

/** Proposed title: the first level-1 heading, otherwise the file name. */
export function propose_title(headings: readonly HeadingLike[] | undefined, basename: string): string {
	const first = headings?.find((heading) => heading.level === 1);
	const text = first ? plain_heading(first.heading) : '';
	return text !== '' ? text : basename.trim();
}
