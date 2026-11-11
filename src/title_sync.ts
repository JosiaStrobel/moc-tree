import { type App, type CachedMetadata, type Component, debounce, TFile } from 'obsidian';
import { is_in_folders, managed_folders } from './scope';
import type { PluginSettings } from './settings';
import { edit_file } from './structure_actions';
import { read_title } from './structure_frontmatter';
import { sync_title_alias } from './title_aliases';

/** Quiet time after the last title change before aliases are updated, in ms. */
const SYNC_DELAY_MS = 2000;

/**
 * Keeps `aliases` in line with `title` for the active managed note.
 * Remembers the title when a note is opened; changes to other notes (e.g. by sync) only
 * update the remembered title and never trigger a write.
 */
export class TitleSync {
	private readonly known = new Map<string, string | null>();
	/** Title before the first unsynced change, per path. */
	private readonly pending = new Map<string, string | null>();
	private readonly schedule_flush = debounce(() => void this.flush(), SYNC_DELAY_MS, true);

	constructor(
		private readonly app: App,
		private readonly get_settings: () => PluginSettings,
	) {}

	/** Hook into workspace and metadata events; everything is released with the component. */
	attach(component: Component): void {
		const { workspace, metadataCache, vault } = this.app;
		component.registerEvent(
			workspace.on('file-open', (file) => {
				void this.flush();
				if (file) this.remember(file);
			}),
		);
		component.registerEvent(metadataCache.on('changed', (file, _data, cache) => this.on_changed(file, cache)));
		component.registerEvent(
			vault.on('rename', (file, old_path) => {
				for (const map of [this.known, this.pending]) {
					if (!map.has(old_path)) continue;
					map.set(file.path, map.get(old_path) ?? null);
					map.delete(old_path);
				}
			}),
		);
		workspace.onLayoutReady(() => {
			const file = workspace.getActiveFile();
			if (file) this.remember(file);
		});
		component.register(() => this.schedule_flush.cancel());
	}

	/** True if the file lies in a managed folder. */
	private is_managed(file: TFile): boolean {
		const settings = this.get_settings();
		return is_in_folders(file.path, managed_folders(settings.newNoteFolder, settings.watchedFolders));
	}

	/** Store the current title of a file as the starting point for later changes. */
	private remember(file: TFile): void {
		if (this.known.has(file.path)) return;
		this.known.set(file.path, read_title(this.app.metadataCache.getFileCache(file)?.frontmatter));
	}

	/** Track title changes; only the active managed note schedules an alias update. */
	private on_changed(file: TFile, cache: CachedMetadata): void {
		const title = read_title(cache.frontmatter);
		const tracked = this.known.has(file.path);
		const old_title = this.known.get(file.path) ?? null;
		this.known.set(file.path, title);
		const is_active = this.app.workspace.getActiveFile()?.path === file.path;
		if (!tracked || !is_active || title === old_title || !this.is_managed(file)) return;
		if (!this.pending.has(file.path)) this.pending.set(file.path, old_title);
		this.schedule_flush();
	}

	/** Write all pending alias updates. */
	private async flush(): Promise<void> {
		const pending = [...this.pending];
		this.pending.clear();
		for (const [path, old_title] of pending) {
			const file = this.app.vault.getAbstractFileByPath(path);
			if (!(file instanceof TFile)) continue;
			const title = read_title(this.app.metadataCache.getFileCache(file)?.frontmatter);
			if (title === null || title === old_title) continue;
			try {
				await edit_file(this.app, file, (text) => sync_title_alias(text, old_title, title));
			} catch (error) {
				console.error('moc-tree: title sync failed', error);
			}
		}
	}
}
