/** Find managed notes by title and aliases for link suggestions (no Obsidian dependency). */
import { display_name, type NoteInput } from './structure_index';

/** One search hit; `alias` is set if the match came from an alias. */
export interface NoteMatch {
	path: string;
	name: string;
	alias: string | null;
}

/** Lower case without accents, for tolerant matching. */
function fold(text: string): string {
	return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

/** Rank of a text for the query: 0 prefix, 1 contained, null no match. */
function rank(text: string, query: string): number | null {
	const index = fold(text).indexOf(query);
	if (index < 0) return null;
	return index === 0 ? 0 : 1;
}

/**
 * Managed notes matching the query, best first: title prefix, title contains,
 * alias prefix, alias contains; ties sorted by name. Empty query lists all notes.
 */
export function search_notes(notes: Iterable<NoteInput>, query: string, limit: number): NoteMatch[] {
	const folded = fold(query.trim());
	const hits: { match: NoteMatch; score: number }[] = [];
	for (const note of notes) {
		if (!note.managed) continue;
		const name = display_name(note);
		const name_rank = rank(name, folded);
		if (name_rank !== null) {
			hits.push({ match: { path: note.path, name, alias: null }, score: name_rank });
			continue;
		}
		let best: { alias: string; score: number } | null = null;
		for (const alias of note.aliases) {
			const alias_rank = rank(alias, folded);
			if (alias_rank !== null && (best === null || alias_rank + 2 < best.score)) {
				best = { alias, score: alias_rank + 2 };
			}
		}
		if (best) hits.push({ match: { path: note.path, name, alias: best.alias }, score: best.score });
	}
	return hits
		.sort((a, b) => a.score - b.score || a.match.name.localeCompare(b.match.name) || a.match.path.localeCompare(b.match.path))
		.slice(0, limit)
		.map((hit) => hit.match);
}
