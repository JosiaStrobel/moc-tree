import { describe, expect, it } from 'vitest';
import { build_folder_tree, filter_folder_tree, folder_chain, folder_paths } from './folder_tree';

const files = [
	{ path: 'Bibel/AT/Genesis 10.md', name: 'Genesis 10', is_note: true },
	{ path: 'Bibel/AT/Genesis 2.md', name: 'Genesis 2', is_note: true },
	{ path: 'Bibel/Übersicht.md', name: 'Übersicht', is_note: true },
	{ path: 'Bibel/NT/Römer 1.md', name: 'Römer 1', is_note: true },
	{ path: 'Andere/X.md', name: 'X', is_note: true },
	{ path: 'Medien/Bilder/Karte.png', name: 'Karte.png', is_note: false },
];

describe('build_folder_tree', () => {
	it('puts folders first, sorts naturally and counts notes', () => {
		const tree = build_folder_tree('Bibel', files);
		expect(tree.name).toBe('Bibel');
		expect(tree.file_count).toBe(4);
		expect(tree.children.map((child) => child.name)).toEqual(['AT', 'NT', 'Übersicht']);
		const at = tree.children[0];
		expect(at?.kind === 'folder' && at.children.map((child) => child.name)).toEqual(['Genesis 2', 'Genesis 10']);
	});

	it('shows folders that hold only media files', () => {
		const tree = build_folder_tree('Medien', files);
		expect(tree.file_count).toBe(1);
		expect(folder_paths(tree)).toEqual(['Medien', 'Medien/Bilder']);
	});

	it('handles nested roots and ignores files outside', () => {
		const tree = build_folder_tree('Bibel/AT', files);
		expect(tree.name).toBe('AT');
		expect(tree.children.map((child) => child.path)).toEqual(['Bibel/AT/Genesis 2.md', 'Bibel/AT/Genesis 10.md']);
	});
});

describe('filter_folder_tree', () => {
	it('keeps matching notes and their folders, accent-tolerant', () => {
		const filtered = filter_folder_tree(build_folder_tree('Bibel', files), 'romer');
		expect(filtered?.file_count).toBe(1);
		expect(filtered && folder_paths(filtered)).toEqual(['Bibel', 'Bibel/NT']);
	});

	it('returns null without matches', () => {
		expect(filter_folder_tree(build_folder_tree('Bibel', files), 'zzz')).toBeNull();
	});
});

describe('folder_chain', () => {
	it('lists the folders from the root to the file', () => {
		expect(folder_chain(['Andere', 'Bibel'], 'Bibel/AT/Genesis 2.md')).toEqual(['Bibel', 'Bibel/AT']);
		expect(folder_chain(['Bibel'], 'Bibel/Übersicht.md')).toEqual(['Bibel']);
		expect(folder_chain(['Bibel'], 'Zettel/A.md')).toBeNull();
	});
});
