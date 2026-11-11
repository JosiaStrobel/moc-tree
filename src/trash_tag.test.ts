import { describe, expect, it } from 'vitest';
import { add_trash_tag, has_trash_tag, remove_trash_tag } from './trash_tag';

const NOTE = '---\ntitle: Linsen\ntags:\n  - optik\n---\nText\n';

describe('has_trash_tag', () => {
	it('ignores case and a leading #', () => {
		expect(has_trash_tag(['#optik', '#Papierkorb'], 'papierkorb')).toBe(true);
		expect(has_trash_tag(['#papierkorb/alt'], 'papierkorb')).toBe(false);
	});
});

describe('add_trash_tag', () => {
	it('appends to the tag list', () => {
		expect(add_trash_tag(NOTE, 'papierkorb')).toBe(
			'---\ntitle: Linsen\ntags:\n  - optik\n  - papierkorb\n---\nText\n',
		);
	});

	it('creates the tag list and keeps an existing spelling', () => {
		expect(add_trash_tag('---\ntitle: A\n---\n', 'papierkorb')).toBe(
			'---\ntitle: A\ntags:\n  - papierkorb\n---\n',
		);
		const tagged = '---\ntags: [Papierkorb]\n---\n';
		expect(add_trash_tag(tagged, 'papierkorb')).toBe(tagged);
	});

	it('refuses a single-value tag property it cannot edit safely', () => {
		expect(add_trash_tag('---\ntags: |\n  optik\n---\n', 'papierkorb')).toBeNull();
	});
});

describe('remove_trash_tag', () => {
	it('removes every spelling and keeps other tags', () => {
		const text = '---\ntags:\n  - "#Papierkorb"\n  - optik\n  - papierkorb\n---\n';
		expect(remove_trash_tag(text, 'papierkorb')).toBe('---\ntags:\n  - optik\n---\n');
	});

	it('leaves notes without the tag unchanged', () => {
		expect(remove_trash_tag(NOTE, 'papierkorb')).toBe(NOTE);
		expect(remove_trash_tag('Text', 'papierkorb')).toBe('Text');
	});
});
