import { describe, expect, it } from 'vitest';
import { cycle_members, find_list_issues } from './structure_check';
import { build_structure_index, type NoteInput } from './structure_index';

/** Resolve `[[x]]` and `[[x|y]]` to `x.md`, except for `gone`. */
function resolve(value: string): string | null {
	const target = /^\[\[([^|\]]+)/.exec(value)?.[1];
	return target && target !== 'gone' ? `${target}.md` : null;
}

describe('find_list_issues', () => {
	it('reports later duplicates and dead links by position', () => {
		const values = ['[[a]]', '[[gone]]', '[[a|A]]', '[[b]]', '[[gone]]', '[[a]]'];
		expect(find_list_issues(values, resolve)).toEqual([
			{ index: 1, value: '[[gone]]', kind: 'dead' },
			{ index: 2, value: '[[a|A]]', kind: 'duplicate' },
			{ index: 4, value: '[[gone]]', kind: 'duplicate' },
			{ index: 5, value: '[[a]]', kind: 'duplicate' },
		]);
	});

	it('finds nothing in a clean list', () => {
		expect(find_list_issues(['[[a]]', '[[b]]'], resolve)).toEqual([]);
	});
});

describe('cycle_members', () => {
	/** Managed MOC input. */
	const moc = (path: string, kids: string[]): NoteInput => ({
		path,
		basename: path,
		title: path,
		aliases: [],
		managed: true,
		trashed: false,
		children: kids.map((kid) => ({ link: kid, path: kid })),
	});

	it('lists every folder on a cycle, but not folders merely pointing into one', () => {
		const index = build_structure_index([
			moc('a.md', ['b.md']),
			moc('b.md', ['c.md']),
			moc('c.md', ['a.md']),
			moc('d.md', ['a.md']),
			moc('s.md', ['s.md']),
		]);
		expect(cycle_members(index)).toEqual(['a.md', 'b.md', 'c.md', 's.md']);
	});
});
