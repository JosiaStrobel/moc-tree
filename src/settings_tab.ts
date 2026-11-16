import { type App, PluginSettingTab, type SettingDefinitionItem } from 'obsidian';
import { FolderSuggestModal } from './folder_suggest_modal';
import { t } from './i18n';
import type MainPlugin from './main';
import { clean_folder_path } from './scope';
import { clean_tag, DEFAULT_SETTINGS, is_valid_property_key, is_valid_tag, parse_settings } from './settings';

/** Settings holding a list of folders. */
type FolderListKey = 'watchedFolders' | 'shownFolders';

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
				onDelete: (index) => void this.update_folders('watchedFolders', (folders) => folders.splice(index, 1)),
				addItem: {
					name: t('settings.watched_folders.add'),
					action: () => this.pick_folder('watchedFolders'),
				},
			},
			{
				type: 'list',
				heading: t('settings.shown_folders.heading'),
				emptyState: t('settings.shown_folders.empty'),
				items: settings.shownFolders.map((folder) => ({ name: folder })),
				onDelete: (index) => void this.update_folders('shownFolders', (folders) => folders.splice(index, 1)),
				addItem: {
					name: t('settings.shown_folders.add'),
					action: () => this.pick_folder('shownFolders'),
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
						name: t('settings.trash_tag.name'),
						desc: t('settings.trash_tag.desc'),
						control: {
							type: 'text',
							key: 'trashTag',
							defaultValue: DEFAULT_SETTINGS.trashTag,
							placeholder: DEFAULT_SETTINGS.trashTag,
							validate: (value) => (is_valid_tag(clean_tag(value)) ? undefined : t('settings.trash_tag.invalid')),
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
					{
						name: t('settings.structure_file.name'),
						desc: t('settings.structure_file.desc'),
						control: { type: 'toggle', key: 'structureFile', defaultValue: DEFAULT_SETTINGS.structureFile },
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

	/** Let the user pick a vault folder and append it to a folder list. */
	private pick_folder(key: FolderListKey): void {
		new FolderSuggestModal(this.app, (folder) => {
			void this.update_folders(key, (folders) => folders.push(folder.path));
		}).open();
	}

	/** Apply a change to a folder list, save, and rebuild the list. */
	private async update_folders(key: FolderListKey, change: (folders: string[]) => void): Promise<void> {
		const folders = [...this.plugin.settings[key]];
		change(folders);
		this.plugin.settings = parse_settings({ ...this.plugin.settings, [key]: folders.map(clean_folder_path) });
		await this.plugin.save_settings();
		this.update();
	}
}
