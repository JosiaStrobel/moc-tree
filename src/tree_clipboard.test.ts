import { describe, expect, it, vi } from 'vitest';
import { build_structure_index, type NoteInput } from './structure_index';
import { pending_valid, put_request, TreeClipboard } from './tree_clipboard';

/** Managed note input; `kids` makes it a MOC. */
function note(path: string, kids?: string[], trashed = false): NoteInput {
	const children = kids?.map((kid) => ({ link: kid, path: kid })) ?? null;
	return { path, basename: path, title: path, aliases: [], managed: true, children, trashed };
}

// p ─┬─ a
//    └─ o ── s
// m ── a
// n (orphan)
const index = build_structure_index([
	note('p', ['a', 'o']),
	note('o', ['s']),
	note('s', []),
	note('m', ['a']),
	note('a'),
	note('n'),
]);

describe('put_request', () => {
	it('moves to the end of the target folder', () => {
		expect(put_request(index, { path: 'n', from: null, copy: false }, 's')).toEqual({
			path: 'n',
			from: null,
			to: 's',
			anchor: null,
			copy: false,
		});
	});

	it('keeps the copy flag', () => {
		expect(put_request(index, { path: 'a', from: 'p', copy: true }, 's')?.copy).toBe(true);
	});

	it('refuses the folder itself and its subfolders', () => {
		expect(put_request(index, { path: 'o', from: 'p', copy: false }, 'o')).toBeNull();
		expect(put_request(index, { path: 'o', from: 'p', copy: false }, 's')).toBeNull();
	});

	it('refuses folders that already list the entry', () => {
		expect(put_request(index, { path: 'a', from: 'p', copy: false }, 'p')).toBeNull();
		expect(put_request(index, { path: 'a', from: 'p', copy: false }, 'm')).toBeNull();
	});

	it('puts into the orphans only when moving out of a folder', () => {
		expect(put_request(index, { path: 'a', from: 'p', copy: false }, null)?.to).toBeNull();
		expect(put_request(index, { path: 'a', from: 'p', copy: true }, null)).toBeNull();
		expect(put_request(index, { path: 'n', from: null, copy: false }, null)).toBeNull();
	});
});

describe('pending_valid', () => {
	it('accepts an entry still in its folder or at top level', () => {
		expect(pending_valid(index, { path: 'a', from: 'p', copy: false })).toBe(true);
		expect(pending_valid(index, { path: 'n', from: null, copy: false })).toBe(true);
	});

	it('rejects vanished, moved and trashed entries', () => {
		expect(pending_valid(index, { path: 'gone', from: null, copy: false })).toBe(false);
		expect(pending_valid(index, { path: 's', from: 'p', copy: false })).toBe(false);
		const trashed = build_structure_index([note('p', ['a']), note('a', undefined, true)]);
		expect(pending_valid(trashed, { path: 'a', from: 'p', copy: false })).toBe(false);
	});
});

describe('TreeClipboard', () => {
	it('notifies on change and drops invalid entries on revalidate', () => {
		const on_change = vi.fn();
		const clipboard = new TreeClipboard(on_change);
		clipboard.set({ path: 's', from: 'p', copy: false });
		expect(on_change).toHaveBeenCalledOnce();
		clipboard.revalidate(index);
		expect(clipboard.pending).toBeNull();
	});
});
