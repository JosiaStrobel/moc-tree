import { type App, type Menu, type TAbstractFile, TFile } from 'obsidian';
import { add_change_title_item } from './change_title';
import { t } from './i18n';
import { is_in_folders, managed_folders } from './scope';
import type { PluginSettings } from './settings';
import { reveal_in_structure } from './structure_view_open';
import { add_trash_item } from './trash_actions';

/** File menu (explorer, tab header) items for managed notes: reveal in structure, change title, trash. */
export function file_menu_handler(app: App, get_settings: () => PluginSettings) {
	return (menu: Menu, file: TAbstractFile): void => {
		if (!(file instanceof TFile) || file.extension !== 'md') return;
		const settings = get_settings();
		if (!is_in_folders(file.path, managed_folders(settings.newNoteFolder, settings.watchedFolders))) return;
		menu.addItem((item) =>
			item
				.setTitle(t('menu.reveal'))
				.setIcon('locate-fixed')
				.onClick(() => void reveal_in_structure(app, file.path)),
		);
		add_change_title_item(menu, app, file);
		add_trash_item(menu, app, settings, file);
	};
}
