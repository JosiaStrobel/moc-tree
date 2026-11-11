import { insert_list_item, replace_list_item } from './frontmatter_lines';

/** Frontmatter key holding the aliases. */
const ALIASES_KEY = 'aliases';

/**
 * Update `aliases` after a title change: replace the old title in place, or put the new
 * title first if the old one is not listed. Returns the same text if nothing changes,
 * null if the aliases cannot be edited safely.
 */
export function sync_title_alias(text: string, old_title: string | null, new_title: string): string | null {
	if (old_title !== null && old_title !== new_title) {
		const replaced = replace_list_item(text, ALIASES_KEY, old_title, new_title);
		if (replaced === null || replaced !== text) return replaced;
	}
	return insert_list_item(text, ALIASES_KEY, new_title, 0);
}
