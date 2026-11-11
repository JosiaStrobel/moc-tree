import { type App, type Component, debounce, normalizePath } from 'obsidian';
import { managed_folders } from './scope';
import type { PluginSettings } from './settings';
import { render_structure_export, STRUCTURE_EXPORT_PATH } from './structure_export';
import type { StructureStore } from './structure_store';

/** Quiet time after the last structure change before the file is rewritten, in ms. */
const WRITE_DELAY_MS = 5000;

/** Keeps the local structure file for AI tools up to date while the setting is on. */
export class StructureExportWriter {
	/** Content currently on disk as far as known; avoids rewriting unchanged files. */
	private last_written: string | null = null;
	private readonly schedule = debounce(() => void this.write_if_enabled(), WRITE_DELAY_MS, true);

	constructor(
		private readonly app: App,
		private readonly store: StructureStore,
		private readonly get_settings: () => PluginSettings,
	) {}

	/** Listen for structure changes; everything is released with the component. */
	attach(component: Component): void {
		component.register(this.store.on_change(() => this.schedule()));
		component.register(() => this.schedule.cancel());
		this.app.workspace.onLayoutReady(() => this.schedule());
	}

	/** Write now regardless of the setting (command); returns the vault path. */
	async write(): Promise<string> {
		const settings = this.get_settings();
		const content = render_structure_export(this.store.get_index(), {
			folders: managed_folders(settings.newNoteFolder, settings.watchedFolders),
			structure_key: settings.structureKey,
			trash_tag: settings.trashTag,
		});
		const path = normalizePath(STRUCTURE_EXPORT_PATH);
		const adapter = this.app.vault.adapter;
		if (this.last_written === null && (await adapter.exists(path))) this.last_written = await adapter.read(path);
		if (content === this.last_written) return path;
		const folder = path.slice(0, path.lastIndexOf('/'));
		if (folder !== '' && !(await adapter.exists(folder))) await adapter.mkdir(folder);
		await adapter.write(path, content);
		this.last_written = content;
		return path;
	}

	/** Scheduled write; only while the setting is on. */
	private async write_if_enabled(): Promise<void> {
		if (!this.get_settings().structureFile) return;
		try {
			await this.write();
		} catch (error) {
			console.error('MOC Tree: writing the structure file failed', error);
		}
	}
}
