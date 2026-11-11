import { describe, expect, it } from 'vitest';
import { place_list_item, remove_entry } from './list_placement';

const TEXT = '---\ntitle: P\nchildren:\n  - "[[a]]"\n  - "[[b|B]]"\n  - "[[c]]"\n---\nBody\n';

/** Predicate matching values that point to a target. */
const to = (target: string) => (value: string) => value === `[[${target}]]` || value.startsWith(`[[${target}|`);

describe('place_list_item', () => {
	it('appends a new entry at the end', () => {
		const result = place_list_item(TEXT, 'children', { is_entry: to('d'), is_anchor: null, after: false, new_value: '[[d]]' });
		expect(result).toBe('---\ntitle: P\nchildren:\n  - "[[a]]"\n  - "[[b|B]]"\n  - "[[c]]"\n  - "[[d]]"\n---\nBody\n');
	});

	it('inserts before or after an anchor', () => {
		const before = place_list_item(TEXT, 'children', { is_entry: to('d'), is_anchor: to('b'), after: false, new_value: '[[d]]' });
		expect(before).toContain('"[[a]]"\n  - "[[d]]"\n  - "[[b|B]]"');
		const after = place_list_item(TEXT, 'children', { is_entry: to('d'), is_anchor: to('b'), after: true, new_value: '[[d]]' });
		expect(after).toContain('"[[b|B]]"\n  - "[[d]]"\n  - "[[c]]"');
	});

	it('moves an existing entry and keeps its spelling', () => {
		const result = place_list_item(TEXT, 'children', { is_entry: to('b'), is_anchor: null, after: false, new_value: '[[b]]' });
		expect(result).toBe('---\ntitle: P\nchildren:\n  - "[[a]]"\n  - "[[c]]"\n  - "[[b|B]]"\n---\nBody\n');
		const up = place_list_item(TEXT, 'children', { is_entry: to('c'), is_anchor: to('a'), after: false, new_value: '[[c]]' });
		expect(up).toContain('children:\n  - "[[c]]"\n  - "[[a]]"\n  - "[[b|B]]"\n---');
	});

	it('returns the same text if the entry already sits there', () => {
		expect(place_list_item(TEXT, 'children', { is_entry: to('c'), is_anchor: null, after: false, new_value: '[[c]]' })).toBe(TEXT);
		const single = '---\nchildren:\n  - "[[a]]"\n---\n';
		expect(place_list_item(single, 'children', { is_entry: to('a'), is_anchor: null, after: false, new_value: '[[a]]' })).toBe(single);
	});

	it('merges duplicates and creates a missing list', () => {
		const dup = '---\nchildren:\n  - "[[a]]"\n  - "[[b]]"\n  - "[[a]]"\n---\n';
		expect(place_list_item(dup, 'children', { is_entry: to('a'), is_anchor: null, after: false, new_value: '[[a]]' })).toBe(
			'---\nchildren:\n  - "[[b]]"\n  - "[[a]]"\n---\n',
		);
		expect(place_list_item('---\ntitle: P\n---\n', 'children', { is_entry: to('a'), is_anchor: null, after: false, new_value: '[[a]]' })).toBe(
			'---\ntitle: P\nchildren:\n  - "[[a]]"\n---\n',
		);
	});

	it('refuses lists it cannot edit', () => {
		expect(place_list_item('---\nchildren: "[[a]]"\n---\n', 'children', { is_entry: to('b'), is_anchor: null, after: false, new_value: '[[b]]' })).toBeNull();
	});
});

describe('remove_entry', () => {
	it('removes all values of the entry', () => {
		expect(remove_entry(TEXT, 'children', to('b'))).toBe('---\ntitle: P\nchildren:\n  - "[[a]]"\n  - "[[c]]"\n---\nBody\n');
		expect(remove_entry(TEXT, 'children', to('x'))).toBe(TEXT);
	});
});
