/** Stored expand state of the structure sidebar (no Obsidian dependency). */

/** Current version of the stored expand state format. */
export const EXPAND_STATE_SCHEMA_VERSION = 1;

/** Separator between the MOC paths of a tree position key. */
const KEY_SEPARATOR = '\n';

/** Expand state as stored per device. */
export interface ExpandState {
	schemaVersion: number;
	/** Expanded tree positions: MOC paths from the root, joined by a line break. */
	expanded: string[];
	orphansCollapsed: boolean;
}

/** Key of a tree position: the MOC chain from the root, since a note can appear several times. */
export function position_key(ancestors: readonly string[], path: string): string {
	return [...ancestors, path].join(KEY_SEPARATOR);
}

/** Validate stored data; unknown or broken data gives an empty state. */
export function parse_expand_state(raw: unknown): ExpandState {
	const state: ExpandState = { schemaVersion: EXPAND_STATE_SCHEMA_VERSION, expanded: [], orphansCollapsed: false };
	if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return state;
	const record = raw as Record<string, unknown>;
	if (record.schemaVersion !== EXPAND_STATE_SCHEMA_VERSION) return state;
	if (Array.isArray(record.expanded)) {
		state.expanded = [...new Set(record.expanded.filter((key): key is string => typeof key === 'string' && key !== ''))];
	}
	state.orphansCollapsed = record.orphansCollapsed === true;
	return state;
}

/** Replace a renamed file's path in all position keys. */
export function rename_in_keys(keys: Iterable<string>, old_path: string, new_path: string): string[] {
	return [...keys].map((key) =>
		key
			.split(KEY_SEPARATOR)
			.map((path) => (path === old_path ? new_path : path))
			.join(KEY_SEPARATOR),
	);
}

/** Keep only keys whose paths all still exist. */
export function prune_keys(keys: Iterable<string>, exists: (path: string) => boolean): string[] {
	return [...keys].filter((key) => key.split(KEY_SEPARATOR).every(exists));
}
