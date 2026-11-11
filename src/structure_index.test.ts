import { describe, expect, it } from 'vitest';
import { build_structure_index, child_entries, is_within, type NoteInput } from './structure_index';

/** Build a note input; `kids` lists child paths (`!name` = dead link). */
function note(path: string, title: string | null, kids?: string[], managed = true): NoteInput {
	const basename = path.replace(/^.*\//, '').replace(/\.md$/, '');
	const children =
		kids?.map((kid) =>
			kid.startsWith('!') ? { link: kid.slice(1), path: null } : { link: kid, path: kid },
		) ?? null;
	return { path, basename, title, aliases: [], managed, children };
}

describe('build_structure_index', () => {
	it('finds roots, sorted by title', () => {
		const index = build_structure_index([
			note('z.md', 'Zoologie', []),
			note('p.md', 'Physik', ['o.md']),
			note('o.md', 'Optik', []),
		]);
		expect(index.roots).toEqual(['p.md', 'z.md']);
	});

	it('lists managed normal notes without parent as orphans', () => {
		const index = build_structure_index([
			note('p.md', 'Physik', ['a.md']),
			note('a.md', 'A'),
			note('b.md', 'B'),
			note('x.md', 'X', undefined, false),
		]);
		expect(index.orphans).toEqual(['b.md']);
	});

	it('counts distinct parents and merges duplicate links', () => {
		const index = build_structure_index([
			note('p.md', 'Physik', ['a.md', 'a.md']),
			note('m.md', 'Mathe', ['a.md']),
			note('a.md', 'A'),
		]);
		expect(index.parents.get('a.md')).toEqual(['p.md', 'm.md']);
		expect(index.children.get('p.md')).toHaveLength(1);
	});

	it('keeps MOCs that only hang in a cycle visible', () => {
		const index = build_structure_index([
			note('a.md', 'A', ['b.md']),
			note('b.md', 'B', ['a.md', 'n.md']),
			note('n.md', 'N'),
		]);
		expect(index.roots).toEqual(['a.md']);
		expect(index.orphans).toEqual([]);
	});

	it('shows a note whose only parent is an unreachable outside MOC as orphan', () => {
		const index = build_structure_index([
			note('x.md', 'X', ['a.md'], false),
			note('a.md', 'A'),
		]);
		expect(index.roots).toEqual([]);
		expect(index.orphans).toEqual(['a.md']);
	});
});

describe('child_entries', () => {
	const index = build_structure_index([
		note('p.md', 'Physik', ['o.md', '!fehlt', 'x.md', 'a.md']),
		note('o.md', 'Optik', ['p.md']),
		note('x.md', 'Extern', undefined, false),
		note('a.md', null),
		note('m.md', 'Mathe', ['a.md']),
	]);

	it('describes children in list order', () => {
		const rows = child_entries(index, 'p.md', new Set(['p.md']));
		expect(rows.map((row) => [row.kind, row.name])).toEqual([
			['moc', 'Optik'],
			['dead', 'fehlt'],
			['note', 'Extern'],
			['note', 'a'],
		]);
		expect(rows[2]?.outside).toBe(true);
		expect(rows[3]?.missing_title).toBe(true);
		expect(rows[3]?.parent_count).toBe(2);
	});

	it('marks a child that is an ancestor as cycle', () => {
		const rows = child_entries(index, 'o.md', new Set(['p.md', 'o.md']));
		expect(rows.map((row) => row.kind)).toEqual(['cycle']);
	});
});

describe('is_within', () => {
	it('detects the folder itself and everything below it', () => {
		const index = build_structure_index([
			note('p.md', 'Physik', ['o.md']),
			note('o.md', 'Optik', ['l.md']),
			note('l.md', 'Linsen'),
			note('m.md', 'Mathe', []),
		]);
		expect(is_within(index, 'p.md', 'p.md')).toBe(true);
		expect(is_within(index, 'p.md', 'l.md')).toBe(true);
		expect(is_within(index, 'o.md', 'p.md')).toBe(false);
		expect(is_within(index, 'p.md', 'm.md')).toBe(false);
	});
});
