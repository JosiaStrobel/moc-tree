import { clean_folder_path } from './scope';

/** Current version of the stored settings format. */
export const SETTINGS_SCHEMA_VERSION = 5;

/** How new notes get their file name. */
export const FILE_NAMING_MODES = ['timestamp', 'ask'] as const;
export type FileNamingMode = (typeof FILE_NAMING_MODES)[number];

/** Size of rows, text and icons in the structure sidebar. */
export const TREE_SIZES = ['compact', 'normal', 'large'] as const;
export type TreeSize = (typeof TREE_SIZES)[number];

/** Plugin settings as stored in data.json. */
export interface PluginSettings {
	schemaVersion: number;
	/** Folder for newly created notes; always managed. Empty string = vault root. */
	newNoteFolder: string;
	/** Additional managed folders (recursive). */
	watchedFolders: string[];
	/** File name scheme for new notes. */
	fileNaming: FileNamingMode;
	/** Frontmatter property holding the structure links. */
	structureKey: string;
	/** Size of the structure sidebar. */
	treeSize: TreeSize;
	/** Tag (without `#`) that moves a note to the trash. */
	trashTag: string;
	/** Keep a local Markdown overview of the structure for AI tools. */
	structureFile: boolean;
}

/** Defaults for missing or invalid settings. */
export const DEFAULT_SETTINGS: Readonly<PluginSettings> = {
	schemaVersion: SETTINGS_SCHEMA_VERSION,
	newNoteFolder: 'Zettel',
	watchedFolders: [],
	fileNaming: 'timestamp',
	structureKey: 'children',
	treeSize: 'normal',
	trashTag: 'papierkorb',
	structureFile: false,
};

/** True for plain objects. */
function is_record(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** True for a usable frontmatter key: letters, digits, `_` and `-`. */
export function is_valid_property_key(key: string): boolean {
	return /^[\p{L}\p{N}_-]+$/u.test(key);
}

/** Tag text without a leading `#`, trimmed. */
export function clean_tag(tag: string): string {
	return tag.trim().replace(/^#/, '');
}

/** True for a usable tag: letters, digits, `_`, `-`, `/` and not only digits. */
export function is_valid_tag(tag: string): boolean {
	return /^[\p{L}\p{N}_/-]+$/u.test(tag) && !/^\d+$/.test(tag);
}

/** Clean a folder list: normalize paths, drop empty entries and duplicates. */
function parse_folder_list(raw: unknown): string[] {
	if (!Array.isArray(raw)) return [];
	const folders = raw
		.filter((entry): entry is string => typeof entry === 'string')
		.map(clean_folder_path)
		.filter((folder) => folder !== '');
	return [...new Set(folders)];
}

/** Validate raw stored data, migrate old schema versions and fill in defaults. */
export function parse_settings(raw: unknown): PluginSettings {
	const settings: PluginSettings = { ...DEFAULT_SETTINGS, watchedFolders: [] };
	if (!is_record(raw)) return settings;
	// Schema 1 only had the template's example setting; schemas 2 to 4 lacked treeSize, trashTag or structureFile
	// (defaults apply).
	if (typeof raw.newNoteFolder === 'string') {
		settings.newNoteFolder = clean_folder_path(raw.newNoteFolder);
	}
	settings.watchedFolders = parse_folder_list(raw.watchedFolders);
	if (FILE_NAMING_MODES.includes(raw.fileNaming as FileNamingMode)) {
		settings.fileNaming = raw.fileNaming as FileNamingMode;
	}
	if (typeof raw.structureKey === 'string' && is_valid_property_key(raw.structureKey.trim())) {
		settings.structureKey = raw.structureKey.trim();
	}
	if (TREE_SIZES.includes(raw.treeSize as TreeSize)) settings.treeSize = raw.treeSize as TreeSize;
	if (typeof raw.trashTag === 'string' && is_valid_tag(clean_tag(raw.trashTag))) {
		settings.trashTag = clean_tag(raw.trashTag);
	}
	if (typeof raw.structureFile === 'boolean') settings.structureFile = raw.structureFile;
	return settings;
}
