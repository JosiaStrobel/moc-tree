import { describe, expect, it } from 'vitest';
import { build_structure_index, type NoteInput } from './structure_index';
import { find_positions, match_ancestors } from './tree_find';

/** Managed note input; `kids` makes it a folder. */
function note(path: string, kids?: string[]): NoteInput {
	return {
		path,
		basename: path,
		title: path,
		aliases: [],
		managed: true,
		trashed: false,
		children: kids?.map((kid) => ({ link: kid, path: kid })) ?? null,
	};
}

const index = build_structure_index([
	note('p', ['o', 'x']),
	note('o', ['l', 'o']),
	note('l', ['x']),
	note('m', ['x']),
	note('x'),
	note('w'),
]);

describe('find_positions', () => {
	it('finds every position, shortest first, without following cycles', () => {
		expect(find_positions(index, 'x')).toEqual([['m'], ['p'], ['p', 'o', 'l']]);
		expect(find_positions(index, 'l')).toEqual([['p', 'o']]);
	});

	it('gives an empty chain for roots and nothing for orphans', () => {
		expect(find_positions(index, 'p')).toEqual([[]]);
		expect(find_positions(index, 'w')).toEqual([]);
	});

	it('respects the limit', () => {
		expect(find_positions(index, 'x', 1)).toHaveLength(1);
	});
});

describe('match_ancestors', () => {
	it('collects all folders above the matches', () => {
		expect([...match_ancestors(index, new Set(['l']))].sort()).toEqual(['o', 'p']);
		expect([...match_ancestors(index, new Set(['w']))]).toEqual([]);
	});
});
