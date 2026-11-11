import { describe, expect, it } from 'vitest';
import { build_note_content, clean_title, sanitize_file_name, timestamp_id, unique_name } from './note_naming';

describe('timestamp_id', () => {
	it('formats local time with seconds and a suffix', () => {
		const date = new Date(2026, 10, 10, 9, 12, 30);
		expect(timestamp_id(date, () => 0)).toBe('2026111009123000');
		expect(timestamp_id(date, () => 0.999)).toBe('2026111009123099');
	});
});

describe('sanitize_file_name', () => {
	it('removes invalid characters', () => {
		expect(sanitize_file_name(' Kapitel: 1 / [Teil] # ')).toBe('Kapitel 1 Teil');
		expect(sanitize_file_name('..hidden')).toBe('hidden');
		expect(sanitize_file_name('???')).toBe('');
	});
});

describe('unique_name', () => {
	it('appends a counter on conflicts', () => {
		const taken = new Set(['Linsen', 'Linsen 2']);
		expect(unique_name('Optik', (name) => taken.has(name))).toBe('Optik');
		expect(unique_name('Linsen', (name) => taken.has(name))).toBe('Linsen 3');
	});
});

describe('clean_title', () => {
	it('trims and rejects empty or multi-line titles', () => {
		expect(clean_title('  Linsen ')).toBe('Linsen');
		expect(clean_title('   ')).toBeNull();
		expect(clean_title('a\nb')).toBeNull();
	});
});

describe('build_note_content', () => {
	it('writes title and alias for a note', () => {
		expect(build_note_content('Linsen', null)).toBe('---\ntitle: Linsen\naliases:\n  - Linsen\n---\n');
	});

	it('adds an empty structure list for folders and quotes tricky titles', () => {
		expect(build_note_content('Kapitel: 1', 'children')).toBe(
			'---\ntitle: "Kapitel: 1"\naliases:\n  - "Kapitel: 1"\nchildren: []\n---\n',
		);
	});
});
