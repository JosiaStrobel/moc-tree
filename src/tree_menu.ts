import { type App, Menu, Platform, type TFile } from 'obsidian';
import { add_change_title_item } from './change_title';
import { ConvertNoteModal } from './convert_note_modal';
import { open_new_note_dialog } from './create_note';
import { t } from './i18n';
import type { PluginSettings } from './settings';
import { convert_to_folder, convert_to_note, file_at } from './structure_actions';
import { display_name, type StructureIndex, type TreeEntry } from './structure_index';
import { add_file_in_items, add_reorder_items, add_unfile_item } from './tree_menu_move';

/** Turn a folder into a note; asks where its children go if it still has some. */
function start_convert_to_note(
	app: App,
	settings: PluginSettings,
	index: StructureIndex,
	entry: TreeEntry,
	parent_path: string | null,
): void {
	const file = file_at(app, entry.path);
	if (!file) return;
	const key = settings.structureKey;
	const children = index.children.get(file.path) ?? [];
	if (children.length === 0) {
		void convert_to_note(app, key, file, [], null);
		return;
	}
	const parent = file_at(app, parent_path);
	const parent_note = parent ? index.notes.get(parent.path) : undefined;
	const parent_name = parent ? (parent_note ? display_name(parent_note) : parent.basename) : null;
	new ConvertNoteModal(app, entry.name, children.length, parent_name, (choice) => {
		void convert_to_note(app, key, file, children, choice === 'to_parent' ? parent : null);
	}).open();
}

/** Rarely used items: open, reorder, expand/collapse subtree, move to, also file in. */
function add_more_items(
	menu: Menu,
	app: App,
	settings: PluginSettings,
	index: StructureIndex,
	file: TFile,
	parent_path: string | null,
	toggle_subtree: ((expand: boolean) => void) | null,
): void {
	menu.addItem((item) =>
		item
			.setTitle(t('menu.open'))
			.setIcon('file-input')
			.onClick(() => void app.workspace.getLeaf(false).openFile(file)),
	);
	menu.addItem((item) =>
		item
			.setTitle(t('menu.open_new_tab'))
			.setIcon('file-plus-2')
			.onClick(() => void app.workspace.getLeaf('tab').openFile(file)),
	);
	menu.addSeparator();
	add_reorder_items(menu, app, settings.structureKey, index, file.path, parent_path);
	if (toggle_subtree) {
		menu.addSeparator();
		menu.addItem((item) =>
			item
				.setTitle(t('menu.expand_all'))
				.setIcon('chevrons-up-down')
				.onClick(() => toggle_subtree(true)),
		);
		menu.addItem((item) =>
			item
				.setTitle(t('menu.collapse_all'))
				.setIcon('chevrons-down-up')
				.onClick(() => toggle_subtree(false)),
		);
	}
	menu.addSeparator();
	add_file_in_items(menu, app, settings.structureKey, index, file.path, parent_path);
}

/**
 * Context menu for a tree row: create, change title, convert, reorder. Rarely used items appear
 * after "More …" on desktop; the API cannot change an open menu, so the menu reopens extended
 * at the same spot. On mobile they are always shown.
 */
export function show_entry_menu(
	app: App,
	settings: PluginSettings,
	index: StructureIndex,
	entry: TreeEntry,
	parent_path: string | null,
	event: MouseEvent,
	/** Expands (true) or collapses (false) the folder with all subfolders; folders only. */
	toggle_subtree: ((expand: boolean) => void) | null = null,
	show_more = Platform.isMobile,
): void {
	const file = file_at(app, entry.path);
	if (!file || entry.kind === 'dead') return;
	const is_folder = entry.kind === 'moc' || entry.kind === 'cycle';
	const menu = new Menu();
	if (is_folder) {
		menu.addItem((item) =>
			item
				.setTitle(t('menu.new_note_here'))
				.setIcon('file-plus')
				.onClick(() => open_new_note_dialog(app, settings, false, file)),
		);
		menu.addItem((item) =>
			item
				.setTitle(t('menu.new_folder_here'))
				.setIcon('folder-plus')
				.onClick(() => open_new_note_dialog(app, settings, true, file)),
		);
		menu.addSeparator();
	}
	add_change_title_item(menu, app, file);
	menu.addItem((item) =>
		is_folder
			? item
					.setTitle(t('menu.to_note'))
					.setIcon('file')
					.onClick(() => start_convert_to_note(app, settings, index, entry, parent_path))
			: item
					.setTitle(t('menu.to_folder'))
					.setIcon('folder')
					.onClick(() => void convert_to_folder(app, settings.structureKey, file)),
	);
	add_unfile_item(menu, app, settings.structureKey, index, file.path, parent_path);
	menu.addSeparator();
	if (show_more) {
		add_more_items(menu, app, settings, index, file, parent_path, toggle_subtree);
	} else {
		menu.addItem((item) =>
			item
				.setTitle(t('menu.more'))
				.setIcon('more-horizontal')
				.onClick(() => show_entry_menu(app, settings, index, entry, parent_path, event, toggle_subtree, true)),
		);
	}
	menu.showAtMouseEvent(event);
}
