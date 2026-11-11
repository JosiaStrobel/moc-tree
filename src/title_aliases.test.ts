import { describe, expect, it } from 'vitest';
import { sync_title_alias } from './title_aliases';

describe('sync_title_alias', () => {
	it('replaces the old title in place and keeps other aliases', () => {
		const text = '---\ntitle: Optik\naliases:\n  - Linsen\n  - Lenses\n---\n';
		expect(sync_title_alias(text, 'Linsen', 'Optik')).toBe('---\ntitle: Optik\naliases:\n  - Optik\n  - Lenses\n---\n');
	});

	it('keeps flow style', () => {
		const text = '---\naliases: [Lenses, Linsen]\n---\n';
		expect(sync_title_alias(text, 'Linsen', 'Optik')).toBe('---\naliases: [Lenses, Optik]\n---\n');
	});

	it('puts the new title first if the old one is missing', () => {
		const text = '---\naliases:\n  - Lenses\n---\n';
		expect(sync_title_alias(text, 'Linsen', 'Optik')).toBe('---\naliases:\n  - Optik\n  - Lenses\n---\n');
		expect(sync_title_alias('---\ntitle: A\n---\n', null, 'A')).toBe('---\ntitle: A\naliases:\n  - A\n---\n');
	});

	it('only drops the old title if the new one is already listed', () => {
		const text = '---\naliases:\n  - Linsen\n  - Optik\n---\n';
		expect(sync_title_alias(text, 'Linsen', 'Optik')).toBe('---\naliases:\n  - Optik\n---\n');
		const synced = '---\naliases:\n  - Optik\n---\n';
		expect(sync_title_alias(synced, 'Linsen', 'Optik')).toBe(synced);
	});

	it('refuses aliases written as a single value', () => {
		expect(sync_title_alias('---\naliases: Linsen\n---\n', 'Linsen', 'Optik')).toBeNull();
	});
});
