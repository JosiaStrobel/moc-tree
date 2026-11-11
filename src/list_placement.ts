/** Place an entry in a structure list at a position, moving it if already listed (no Obsidian dependency). */
import { insert_list_item, read_list_items, remove_list_item } from './frontmatter_lines';

/** Where to put the entry: next to an anchor entry, or at the end if there is none. */
export interface Placement {
	/** True for list values that point to the entry being placed. */
	is_entry: (value: string) => boolean;
	/** True for list values that point to the anchor; null = end of list. */
	is_anchor: ((value: string) => boolean) | null;
	after: boolean;
	/** Value to insert if the entry is not listed yet; an existing value keeps its spelling. */
	new_value: string;
}

/**
 * Remove all values of the entry, then insert it once before or after the anchor
 * (end of list if the anchor is missing). Null if the list cannot be edited safely.
 */
export function place_list_item(text: string, key: string, placement: Placement): string | null {
	const values = read_list_items(text, key);
	if (values === null) return null;
	const existing = values.filter(placement.is_entry);
	let next: string | null = text;
	for (const value of new Set(existing)) {
		next = next === null ? null : remove_list_item(next, key, value);
	}
	if (next === null) return null;
	const remaining = read_list_items(next, key);
	if (remaining === null) return null;
	const anchor = placement.is_anchor ? remaining.findIndex(placement.is_anchor) : -1;
	const index = anchor < 0 ? remaining.length : anchor + (placement.after ? 1 : 0);
	const result = insert_list_item(next, key, existing[0] ?? placement.new_value, index);
	// Removing and re-inserting at the same spot can still change an empty list's style.
	return result !== null && read_list_items(result, key)?.join('\n') === values.join('\n') ? text : result;
}

/** Remove all values of an entry from a structure list. */
export function remove_entry(text: string, key: string, is_entry: (value: string) => boolean): string | null {
	const values = read_list_items(text, key);
	if (values === null) return null;
	let next: string | null = text;
	for (const value of new Set(values.filter(is_entry))) {
		next = next === null ? null : remove_list_item(next, key, value);
	}
	return next;
}
