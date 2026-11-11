import type { App } from 'obsidian';
import {
	EXPAND_STATE_SCHEMA_VERSION,
	type ExpandState,
	parse_expand_state,
	prune_keys,
	rename_in_keys,
} from './expand_state';

/** Local storage key (per device and vault) for the expand state. */
const EXPAND_STATE_KEY = 'moc-tree-expand-state';

/** Expanded tree positions and the orphan section state, persisted per device and vault. */
export class ExpandStore {
	private readonly expanded = new Set<string>();
	orphans_collapsed = false;

	constructor(private readonly app: App) {}

	/** True if the tree position is expanded. */
	has(key: string): boolean {
		return this.expanded.has(key);
	}

	/** Expand or collapse positions and save. */
	set(keys: Iterable<string>, expand: boolean): void {
		for (const key of keys) {
			if (expand) this.expanded.add(key);
			else this.expanded.delete(key);
		}
		this.save();
	}

	/** Flip one position and save. */
	toggle(key: string): void {
		this.set([key], !this.expanded.has(key));
	}

	/** Collapse or open the orphan section and save. */
	set_orphans_collapsed(collapsed: boolean): void {
		this.orphans_collapsed = collapsed;
		this.save();
	}

	/** Follow a renamed file in all positions. */
	rename(old_path: string, new_path: string): void {
		const keys = rename_in_keys(this.expanded, old_path, new_path);
		this.expanded.clear();
		for (const key of keys) this.expanded.add(key);
		this.save();
	}

	/** Restore the state saved on this device. */
	load(): void {
		const state = parse_expand_state(this.app.loadLocalStorage(EXPAND_STATE_KEY));
		this.expanded.clear();
		for (const key of state.expanded) this.expanded.add(key);
		this.orphans_collapsed = state.orphansCollapsed;
	}

	/** Save the state on this device, dropping positions of deleted notes. */
	private save(): void {
		const exists = (path: string) => this.app.vault.getAbstractFileByPath(path) !== null;
		const state: ExpandState = {
			schemaVersion: EXPAND_STATE_SCHEMA_VERSION,
			expanded: prune_keys(this.expanded, exists),
			orphansCollapsed: this.orphans_collapsed,
		};
		this.app.saveLocalStorage(EXPAND_STATE_KEY, state);
	}
}
