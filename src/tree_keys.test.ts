import { describe, expect, it } from 'vitest';
import { build_structure_index, type NoteInput } from './structure_index';
import { subtree_keys } from './tree_keys';

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

describe('subtree_keys', () => {
	const index = build_structure_index([
		note('p', ['o', 'n', 'm']),
		note('o', ['l', 'p']),
		note('l', []),
		note('m', []),
		note('n'),
	]);

	it('collects the folder and all subfolder positions, skipping notes and cycles', () => {
		expect(subtree_keys(index, [], 'p')).toEqual(['p', 'p\no', 'p\no\nl', 'p\nm']);
	});

	it('starts below the given ancestors and respects the limit', () => {
		expect(subtree_keys(index, ['p'], 'o')).toEqual(['p\no', 'p\no\nl']);
		expect(subtree_keys(index, [], 'p', 2)).toEqual(['p', 'p\no']);
	});
});
