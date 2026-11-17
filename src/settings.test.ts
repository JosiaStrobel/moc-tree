import { describe, expect, it } from 'vitest';
import { ai_folder_issue, DEFAULT_SETTINGS, is_valid_property_key, parse_settings, SETTINGS_SCHEMA_VERSION } from './settings';

describe('parse_settings', () => {
	it('returns defaults for missing data', () => {
		expect(parse_settings(null)).toEqual(DEFAULT_SETTINGS);
	});

	it('migrates schema 1 to defaults', () => {
		expect(parse_settings({ schemaVersion: 1, exampleFlag: true })).toEqual(DEFAULT_SETTINGS);
	});

	it('keeps valid values', () => {
		const settings = parse_settings({
			newNoteFolder: '/Notes/',
			watchedFolders: ['A', 'A/', '', 3, 'B'],
			fileNaming: 'ask',
			structureKey: ' kinder ',
		});
		expect(settings.newNoteFolder).toBe('Notes');
		expect(settings.watchedFolders).toEqual(['A', 'B']);
		expect(settings.fileNaming).toBe('ask');
		expect(settings.structureKey).toBe('kinder');
	});

	it('drops invalid values', () => {
		const settings = parse_settings({ fileNaming: 'random', structureKey: 'a b', watchedFolders: 'A' });
		expect(settings.fileNaming).toBe(DEFAULT_SETTINGS.fileNaming);
		expect(settings.structureKey).toBe(DEFAULT_SETTINGS.structureKey);
		expect(settings.watchedFolders).toEqual([]);
	});

	it('does not share the default folder lists', () => {
		const settings = parse_settings(null);
		settings.watchedFolders.push('X');
		settings.shownFolders.push('Y');
		expect(DEFAULT_SETTINGS.watchedFolders).toEqual([]);
		expect(DEFAULT_SETTINGS.shownFolders).toEqual([]);
	});

	it('cleans the shown folders', () => {
		expect(parse_settings({ shownFolders: ['/Bibel/', 'Bibel', 7] }).shownFolders).toEqual(['Bibel']);
	});
});

describe('is_valid_property_key', () => {
	it('accepts simple keys and rejects spaces or colons', () => {
		expect(is_valid_property_key('children')).toBe(true);
		expect(is_valid_property_key('unter-notizen')).toBe(true);
		expect(is_valid_property_key('a b')).toBe(false);
		expect(is_valid_property_key('a:b')).toBe(false);
		expect(is_valid_property_key('')).toBe(false);
	});

	it('keeps a valid tree size, defaults otherwise and migrates schema 2', () => {
		expect(parse_settings({ treeSize: 'large' }).treeSize).toBe('large');
		expect(parse_settings({ treeSize: 'huge' }).treeSize).toBe('normal');
		const old = parse_settings({ schemaVersion: 2, newNoteFolder: 'Z', structureKey: 'kids' });
		expect(old).toMatchObject({ schemaVersion: SETTINGS_SCHEMA_VERSION, newNoteFolder: 'Z', structureKey: 'kids', treeSize: 'normal' });
	});
});

describe('trash tag', () => {
	it('strips a leading # and rejects invalid tags', () => {
		expect(parse_settings({ trashTag: ' #müll/alt ' }).trashTag).toBe('müll/alt');
		expect(parse_settings({ trashTag: 'a b' }).trashTag).toBe(DEFAULT_SETTINGS.trashTag);
		expect(parse_settings({ trashTag: '123' }).trashTag).toBe(DEFAULT_SETTINGS.trashTag);
		expect(parse_settings({ schemaVersion: 3 }).trashTag).toBe('papierkorb');
	});
});

describe('structure file', () => {
	it('is off by default, keeps booleans and migrates schema 4', () => {
		expect(parse_settings({ schemaVersion: 4 }).structureFile).toBe(false);
		expect(parse_settings({ structureFile: true }).structureFile).toBe(true);
		expect(parse_settings({ structureFile: 'yes' }).structureFile).toBe(false);
	});
});

describe('ai folder', () => {
	it('defaults to .ai-context, migrates schema 6 and cleans paths', () => {
		expect(parse_settings({ schemaVersion: 6 }).aiFolder).toBe('.ai-context');
		expect(parse_settings({ aiFolder: ' /Meta/.ki/ ' }).aiFolder).toBe('Meta/.ki');
		expect(parse_settings({ aiFolder: ' / ' }).aiFolder).toBe('.ai-context');
		expect(parse_settings({ aiFolder: 3 }).aiFolder).toBe('.ai-context');
	});

	it('rejects empty folders and visible folders inside managed ones', () => {
		expect(ai_folder_issue('', ['Zettel'])).toBe('empty');
		expect(ai_folder_issue('Zettel/KI', ['Zettel'])).toBe('managed');
		expect(ai_folder_issue('KI', [''])).toBe('managed');
		expect(ai_folder_issue('Zettel/.ki', ['Zettel'])).toBeNull();
		expect(ai_folder_issue('KI', ['Zettel'])).toBeNull();
	});
});
