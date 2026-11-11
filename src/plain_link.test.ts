import { describe, expect, it } from 'vitest';
import { plain_link_target, wiki_link_path } from './plain_link';

describe('plain_link_target', () => {
	it('accepts links without display text', () => {
		expect(plain_link_target('[[2026111009123048]]')).toBe('2026111009123048');
		expect(plain_link_target('[[Zettel/2026111009123048]]')).toBe('Zettel/2026111009123048');
	});

	it('rejects display texts, subpaths, embeds and Markdown links', () => {
		expect(plain_link_target('[[2026111009123048|Linsen]]')).toBeNull();
		expect(plain_link_target('[[2026111009123048#Abschnitt]]')).toBeNull();
		expect(plain_link_target('[[2026111009123048#^block]]')).toBeNull();
		expect(plain_link_target('![[2026111009123048]]')).toBeNull();
		expect(plain_link_target('[Linsen](2026111009123048.md)')).toBeNull();
		expect(plain_link_target('[[ ]]')).toBeNull();
	});
});

describe('wiki_link_path', () => {
	it('extracts the target of any wiki link value', () => {
		expect(wiki_link_path('[[2026111009123048]]')).toBe('2026111009123048');
		expect(wiki_link_path('[[Zettel/a|Text]]')).toBe('Zettel/a');
		expect(wiki_link_path('[[a#Abschnitt|Text]]')).toBe('a');
		expect(wiki_link_path('[[a#^block]]')).toBe('a');
	});

	it('rejects other values', () => {
		expect(wiki_link_path('a')).toBeNull();
		expect(wiki_link_path('[[#Abschnitt]]')).toBeNull();
		expect(wiki_link_path('![[a]]')).toBeNull();
	});
});
