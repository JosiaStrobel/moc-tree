import { describe, expect, it } from 'vitest';
import { has_structure, read_aliases, read_title, structure_link_texts } from './structure_frontmatter';

describe('has_structure', () => {
	it('detects the property even when empty', () => {
		expect(has_structure({ children: null }, 'children')).toBe(true);
		expect(has_structure({ children: [] }, 'children')).toBe(true);
		expect(has_structure({ title: 'A' }, 'children')).toBe(false);
		expect(has_structure(undefined, 'children')).toBe(false);
	});
});

describe('read_title', () => {
	it('trims and rejects empty values', () => {
		expect(read_title({ title: ' Linsen ' })).toBe('Linsen');
		expect(read_title({ title: 42 })).toBe('42');
		expect(read_title({ title: '' })).toBeNull();
		expect(read_title({ title: ['a'] })).toBeNull();
		expect(read_title(undefined)).toBeNull();
	});
});

describe('read_aliases', () => {
	it('reads lists and single values', () => {
		expect(read_aliases({ aliases: ['Linsen', ' Lenses ', '', null] })).toEqual(['Linsen', 'Lenses']);
		expect(read_aliases({ aliases: 'Linsen' })).toEqual(['Linsen']);
		expect(read_aliases({})).toEqual([]);
		expect(read_aliases(undefined)).toEqual([]);
	});
});

describe('structure_link_texts', () => {
	it('keeps only links of the structure property, in list order', () => {
		const links = [
			{ key: 'children.1', link: 'b' },
			{ key: 'related.0', link: 'x' },
			{ key: 'children.0', link: 'a' },
			{ key: 'childrenx.0', link: 'y' },
		];
		expect(structure_link_texts(links, 'children')).toEqual(['a', 'b']);
	});

	it('accepts a single link without list index', () => {
		expect(structure_link_texts([{ key: 'children', link: 'a' }], 'children')).toEqual(['a']);
		expect(structure_link_texts(undefined, 'children')).toEqual([]);
	});
});
