import { describe, expect, it } from 'vitest';
import { search_notes } from './note_search';
import type { NoteInput } from './structure_index';

/** Build a managed note input. */
function note(path: string, title: string | null, aliases: string[] = [], managed = true, trashed = false): NoteInput {
	return { path, basename: path.replace(/\.md$/, ''), title, aliases, managed, children: null, trashed };
}

const NOTES = [
	note('1.md', 'Optik', ['Optik', 'Linsen']),
	note('2.md', 'Brechung an Linsen', ['Brechung an Linsen']),
	note('3.md', 'Linsen', ['Linsen', 'Lenses']),
	note('4.md', 'Ähnlichkeit'),
	note('5.md', null),
	note('x.md', 'Linsen extern', [], false),
];

describe('search_notes', () => {
	it('ranks title prefix, title contains, then aliases', () => {
		expect(search_notes(NOTES, 'lin', 10).map((hit) => [hit.name, hit.alias])).toEqual([
			['Linsen', null],
			['Brechung an Linsen', null],
			['Optik', 'Linsen'],
		]);
	});

	it('matches aliases and ignores case and accents', () => {
		expect(search_notes(NOTES, 'LENS', 10).map((hit) => hit.path)).toEqual(['3.md']);
		expect(search_notes(NOTES, 'ahnl', 10).map((hit) => hit.path)).toEqual(['4.md']);
	});

	it('lists all managed notes for an empty query, using the file name without title', () => {
		const hits = search_notes(NOTES, '', 3);
		expect(hits.map((hit) => hit.name)).toEqual(['5', 'Ähnlichkeit', 'Brechung an Linsen']);
	});

	it('skips trashed notes', () => {
		expect(search_notes([note('t.md', 'Optik alt', [], true, true)], 'optik', 10)).toEqual([]);
	});
});
