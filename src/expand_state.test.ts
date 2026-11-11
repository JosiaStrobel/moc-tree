import { describe, expect, it } from 'vitest';
import { parse_expand_state, position_key, prune_keys, rename_in_keys } from './expand_state';

describe('parse_expand_state', () => {
	it('reads valid data and drops bad entries', () => {
		const state = parse_expand_state({ schemaVersion: 1, expanded: ['a.md', 'a.md', 3, ''], orphansCollapsed: true });
		expect(state).toEqual({ schemaVersion: 1, expanded: ['a.md'], orphansCollapsed: true });
	});

	it('starts empty for missing, broken or unknown versions', () => {
		const empty = { schemaVersion: 1, expanded: [], orphansCollapsed: false };
		expect(parse_expand_state(null)).toEqual(empty);
		expect(parse_expand_state('x')).toEqual(empty);
		expect(parse_expand_state({ schemaVersion: 99, expanded: ['a.md'] })).toEqual(empty);
	});
});

describe('rename_in_keys', () => {
	it('replaces whole path segments only', () => {
		const keys = [position_key(['p.md'], 'o.md'), position_key([], 'p.md'), position_key([], 'pp.md')];
		expect(rename_in_keys(keys, 'p.md', 'x/p.md')).toEqual(['x/p.md\no.md', 'x/p.md', 'pp.md']);
	});
});

describe('prune_keys', () => {
	it('drops keys with deleted paths', () => {
		const exists = (path: string) => path !== 'gone.md';
		expect(prune_keys(['p.md\no.md', 'p.md\ngone.md', 'gone.md'], exists)).toEqual(['p.md\no.md']);
	});
});
