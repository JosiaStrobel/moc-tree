import { describe, expect, it } from 'vitest';
import { clean_folder_path, is_in_folders, managed_folders } from './scope';

describe('clean_folder_path', () => {
	it('normalizes slashes and whitespace', () => {
		expect(clean_folder_path(' /Zettel//Archiv/ ')).toBe('Zettel/Archiv');
		expect(clean_folder_path('Zettel\\Archiv')).toBe('Zettel/Archiv');
		expect(clean_folder_path('/')).toBe('');
	});
});

describe('managed_folders', () => {
	it('puts the new-note folder first and removes duplicates', () => {
		expect(managed_folders('Zettel', ['Projekte', 'Zettel/'])).toEqual(['Zettel', 'Projekte']);
	});
});

describe('is_in_folders', () => {
	it('matches files in folders and subfolders', () => {
		expect(is_in_folders('Zettel/a.md', ['Zettel'])).toBe(true);
		expect(is_in_folders('Zettel/Archiv/a.md', ['Zettel'])).toBe(true);
	});

	it('does not match folders with the same prefix', () => {
		expect(is_in_folders('Zettelkasten/a.md', ['Zettel'])).toBe(false);
		expect(is_in_folders('a.md', ['Zettel'])).toBe(false);
	});

	it('treats the vault root as the whole vault', () => {
		expect(is_in_folders('a.md', [''])).toBe(true);
	});
});
