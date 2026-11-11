import { getLanguage, Plugin } from 'obsidian';
import { open_new_note_dialog } from './create_note';
import { set_language, t } from './i18n';
import { check_structure } from './check_structure';
import { LinkSuggest } from './link_suggest';
import { file_menu_handler } from './file_menu';
import { DEFAULT_SETTINGS, parse_settings, type PluginSettings } from './settings';
import { SettingsTab } from './settings_tab';
import { StructureStore } from './structure_store';
import { STRUCTURE_VIEW_TYPE, StructureView } from './structure_view';
import { open_structure_view, reveal_in_structure } from './structure_view_open';
import { title_link_post_processor } from './title_links';
import { title_link_extension } from './title_links_editor';
import { TitleSync } from './title_sync';

/** Plugin entry: lifecycle and registration only, logic lives in modules. */
export default class MainPlugin extends Plugin {
	settings: PluginSettings = { ...DEFAULT_SETTINGS };
	structure = new StructureStore(this.app, () => this.settings);
	title_sync = new TitleSync(this.app, () => this.settings);

	async onload(): Promise<void> {
		set_language(getLanguage());
		await this.load_settings();
		this.addSettingTab(new SettingsTab(this.app, this));
		this.structure.attach(this);
		this.title_sync.attach(this);
		this.registerMarkdownPostProcessor(title_link_post_processor(this.app, this.structure));
		this.registerEditorExtension(title_link_extension(this.app, this.structure));
		this.registerEditorSuggest(new LinkSuggest(this.app, this.structure));
		this.registerEvent(this.app.workspace.on('file-menu', file_menu_handler(this.app, () => this.settings)));
		this.addCommand({
			id: 'new-note',
			name: t('command.new_note'),
			callback: () => open_new_note_dialog(this.app, this.settings, false),
		});
		this.addCommand({
			id: 'new-folder',
			name: t('command.new_folder'),
			callback: () => open_new_note_dialog(this.app, this.settings, true),
		});
		this.registerView(STRUCTURE_VIEW_TYPE, (leaf) => new StructureView(leaf, this.structure, () => this.settings));
		this.addRibbonIcon('list-tree', t('command.open_structure'), () => void open_structure_view(this.app));
		this.addCommand({
			id: 'open-structure',
			name: t('command.open_structure'),
			callback: () => void open_structure_view(this.app),
		});
		this.addCommand({
			id: 'reveal-active-note',
			name: t('command.reveal_active'),
			checkCallback: (checking) => {
				const file = this.app.workspace.getActiveFile();
				if (!file) return false;
				if (!checking) void reveal_in_structure(this.app, file.path);
				return true;
			},
		});
		this.addCommand({
			id: 'check-structure',
			name: t('command.check_structure'),
			callback: () => void check_structure(this.app, this.structure, this.settings.structureKey),
		});
	}

	/** Load and validate settings from data.json. */
	async load_settings(): Promise<void> {
		this.settings = parse_settings(await this.loadData());
	}

	/** Persist the current settings to data.json. */
	async save_settings(): Promise<void> {
		await this.saveData(this.settings);
		this.structure.invalidate();
	}
}
