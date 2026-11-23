import { type App, type Component, debounce, normalizePath } from 'obsidian';
import { managed_folders } from './scope';
import type { PluginSettings } from './settings';
import { render_structure_export, STRUCTURE_EXPORT_NAME } from './structure_export';
import type { StructureStore } from './structure_store';

/** Quiet time after the last structure change before the file is rewritten, in ms. */
const WRITE_DELAY_MS = 5000;

/** Keeps the local structure file for AI tools up to date while the setting is on. */
export class StructureExportWriter {
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

	/** Write now regardless of the setting (command); returns the vault path of the structure file. */
	async write(): Promise<string> {
		const settings = this.get_settings();
		const files = render_structure_export(this.store.get_index(), {
			folders: managed_folders(settings.newNoteFolder, settings.watchedFolders),
			inbox: settings.newNoteFolder,
			structure_key: settings.structureKey,
			trash_tag: settings.trashTag,
		});
		for (const [name, content] of files) {
			await this.write_file(normalizePath(`${settings.aiFolder}/${name}`), content);
		}
		return normalizePath(`${settings.aiFolder}/${STRUCTURE_EXPORT_NAME}`);
	}

	/** Write one file unless it already has this content. */
	private async write_file(path: string, content: string): Promise<void> {
		const adapter = this.app.vault.adapter;
		// Compare with the file on disk, not a cached copy: sync tools (e.g. a git pull) may have replaced it
		if ((await adapter.exists(path)) && (await adapter.read(path)) === content) return;
		const folder = path.slice(0, path.lastIndexOf('/'));
		if (folder !== '' && !(await adapter.exists(folder))) await adapter.mkdir(folder);
		await adapter.write(path, content);
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
