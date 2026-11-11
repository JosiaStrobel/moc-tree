import { type App, PluginSettingTab, type SettingDefinitionItem } from 'obsidian';
import { FolderSuggestModal } from './folder_suggest_modal';
import { t } from './i18n';
import type MainPlugin from './main';
import { clean_folder_path } from './scope';
import { DEFAULT_SETTINGS, is_valid_property_key, parse_settings } from './settings';

/** Settings tab of the plugin, built with the declarative settings API. */
export class SettingsTab extends PluginSettingTab {
	constructor(
		app: App,
		private readonly plugin: MainPlugin,
	) {
		super(app, plugin);
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		const settings = this.plugin.settings;
		return [
			{
				type: 'group',
				heading: t('settings.group.new_notes'),
				items: [
					{
						name: t('settings.new_note_folder.name'),
						desc: t('settings.new_note_folder.desc'),
						control: {
							type: 'folder',
							key: 'newNoteFolder',
							defaultValue: DEFAULT_SETTINGS.newNoteFolder,
							placeholder: DEFAULT_SETTINGS.newNoteFolder,
							includeRoot: true,
						},
					},
					{
						name: t('settings.file_naming.name'),
						desc: t('settings.file_naming.desc'),
						control: {
							type: 'dropdown',
							key: 'fileNaming',
							defaultValue: DEFAULT_SETTINGS.fileNaming,
							options: {
								timestamp: t('settings.file_naming.timestamp'),
								ask: t('settings.file_naming.ask'),
							},
						},
					},
				],
			},
			{
				type: 'list',
				heading: t('settings.watched_folders.heading'),
				emptyState: t('settings.watched_folders.empty'),
				items: settings.watchedFolders.map((folder) => ({ name: folder })),
				onDelete: (index) => void this.update_watched_folders((folders) => folders.splice(index, 1)),
				addItem: {
					name: t('settings.watched_folders.add'),
					action: () => {
						new FolderSuggestModal(this.app, (folder) => {
							void this.update_watched_folders((folders) => folders.push(folder.path));
						}).open();
					},
				},
			},
			{
				type: 'group',
				heading: t('settings.group.structure'),
				items: [
					{
						name: t('settings.structure_key.name'),
						desc: t('settings.structure_key.desc'),
						control: {
							type: 'text',
							key: 'structureKey',
							defaultValue: DEFAULT_SETTINGS.structureKey,
							placeholder: DEFAULT_SETTINGS.structureKey,
							validate: (value) =>
								is_valid_property_key(value.trim()) ? undefined : t('settings.structure_key.invalid'),
						},
					},
					{
						name: t('settings.tree_size.name'),
						desc: t('settings.tree_size.desc'),
						control: {
							type: 'dropdown',
							key: 'treeSize',
							defaultValue: DEFAULT_SETTINGS.treeSize,
							options: {
								compact: t('settings.tree_size.compact'),
								normal: t('settings.tree_size.normal'),
								large: t('settings.tree_size.large'),
							},
						},
					},
				],
			},
		];
	}

	getControlValue(key: string): unknown {
		return (this.plugin.settings as unknown as Record<string, unknown>)[key];
	}

	/** Store a changed value through the settings parser, so invalid input never persists. */
	async setControlValue(key: string, value: unknown): Promise<void> {
		this.plugin.settings = parse_settings({ ...this.plugin.settings, [key]: value });
		await this.plugin.save_settings();
	}

	/** Apply a change to the watched-folder list, save, and rebuild the list. */
	private async update_watched_folders(change: (folders: string[]) => void): Promise<void> {
		const folders = [...this.plugin.settings.watchedFolders];
		change(folders);
		this.plugin.settings = parse_settings({
			...this.plugin.settings,
			watchedFolders: folders.map(clean_folder_path),
		});
		await this.plugin.save_settings();
		this.update();
	}
}
