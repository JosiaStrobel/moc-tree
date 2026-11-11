/** Trash tag in the frontmatter `tags` list (no Obsidian dependency). */
import { insert_list_item, read_list_items } from './frontmatter_lines';
import { remove_entry } from './list_placement';

/** Frontmatter key holding the tags. */
const TAGS_KEY = 'tags';

/** True if a tag value (with or without `#`) is the trash tag; case-insensitive like Obsidian. */
export function is_trash_tag(value: string, tag: string): boolean {
	return value.trim().replace(/^#/, '').toLowerCase() === tag.toLowerCase();
}

/** True if any of the note's tags (e.g. from `getAllTags`) is the trash tag. */
export function has_trash_tag(tags: readonly string[], tag: string): boolean {
	return tags.some((value) => is_trash_tag(value, tag));
}

/** Add the trash tag to `tags` unless already listed; null if the tags cannot be edited safely. */
export function add_trash_tag(text: string, tag: string): string | null {
	const values = read_list_items(text, TAGS_KEY);
	if (values === null) return null;
	return has_trash_tag(values, tag) ? text : insert_list_item(text, TAGS_KEY, tag);
}

/** Remove every spelling of the trash tag from `tags`; null if the tags cannot be edited safely. */
export function remove_trash_tag(text: string, tag: string): string | null {
	return remove_entry(text, TAGS_KEY, (value) => is_trash_tag(value, tag));
}
