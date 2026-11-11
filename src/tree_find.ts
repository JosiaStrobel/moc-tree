/** Locate notes in the tree and compute what a search shows (no Obsidian dependency). */
import { search_notes } from './note_search';
import type { StructureIndex } from './structure_index';

/** Upper bound of positions returned for one note. */
export const MAX_POSITIONS = 50;

/**
 * All tree positions of a note as ancestor chains from a root (the note itself excluded),
 * shortest first. A root gives one empty chain; orphans and unreachable notes give none.
 */
export function find_positions(index: StructureIndex, path: string, limit = MAX_POSITIONS): string[][] {
	const found: string[][] = [];
	const visit = (chain: string[], folder: string) => {
		if (found.length >= limit) return;
		const next = [...chain, folder];
		for (const child of index.children.get(folder) ?? []) {
			if (child.path === null || next.includes(child.path)) continue;
			if (child.path === path) found.push(next);
			if (index.children.has(child.path)) visit(next, child.path);
		}
	};
	for (const root of index.roots) {
		if (root === path) found.push([]);
		else visit([], root);
	}
	return found.sort((a, b) => a.length - b.length).slice(0, limit);
}

/** All folders above the given notes (transitively), the notes themselves excluded unless above another. */
export function match_ancestors(index: StructureIndex, matches: ReadonlySet<string>): Set<string> {
	const ancestors = new Set<string>();
	const stack = [...matches];
	while (stack.length > 0) {
		const path = stack.pop() as string;
		for (const parent of index.parents.get(path) ?? []) {
			if (ancestors.has(parent)) continue;
			ancestors.add(parent);
			stack.push(parent);
		}
	}
	return ancestors;
}

/** Active search: matching notes and the folders leading to them. */
export interface SearchFilter {
	matches: ReadonlySet<string>;
	ancestors: ReadonlySet<string>;
}

/** Search filter for a query; null for an empty query. */
export function build_search_filter(index: StructureIndex, query: string, max_hits: number): SearchFilter | null {
	if (query.trim() === '') return null;
	const matches = new Set(search_notes(index.notes.values(), query, max_hits).map((hit) => hit.path));
	return { matches, ancestors: match_ancestors(index, matches) };
}
