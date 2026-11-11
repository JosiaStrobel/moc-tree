import type { App, Menu } from 'obsidian';
import { FolderPickModal } from './folder_pick_modal';
import { t } from './i18n';
import { is_within, type StructureIndex } from './structure_index';
import { move_entry, type MoveRequest } from './structure_moves';

/** Bound move for one entry taken from `parent`. */
function mover(app: App, key: string, index: StructureIndex, path: string, parent: string | null) {
	return (request: Omit<MoveRequest, 'path' | 'from'>) =>
		void move_entry(app, key, index, { path, from: parent, ...request });
}

/** "Remove from folder"; only for entries inside a folder. */
export function add_unfile_item(
	menu: Menu,
	app: App,
	key: string,
	index: StructureIndex,
	path: string,
	parent: string | null,
): void {
	if (parent === null) return;
	const move = mover(app, key, index, path, parent);
	menu.addItem((item) =>
		item
			.setTitle(t('menu.unfile'))
			.setIcon('folder-minus')
			.onClick(() => move({ to: null, anchor: null, copy: false })),
	);
}

/** "Move up" and "Move down"; only for entries inside a folder. */
export function add_reorder_items(
	menu: Menu,
	app: App,
	key: string,
	index: StructureIndex,
	path: string,
	parent: string | null,
): void {
	if (parent === null) return;
	const move = mover(app, key, index, path, parent);
	const siblings = (index.children.get(parent) ?? []).flatMap((child) => (child.path === null ? [] : [child.path]));
	const position = siblings.indexOf(path);
	const above = siblings[position - 1];
	const below = siblings[position + 1];
	menu.addItem((item) =>
		item
			.setTitle(t('menu.move_up'))
			.setIcon('arrow-up')
			.setDisabled(above === undefined)
			.onClick(() => {
				if (above !== undefined) move({ to: parent, anchor: { path: above, after: false }, copy: false });
			}),
	);
	menu.addItem((item) =>
		item
			.setTitle(t('menu.move_down'))
			.setIcon('arrow-down')
			.setDisabled(below === undefined)
			.onClick(() => {
				if (below !== undefined) move({ to: parent, anchor: { path: below, after: true }, copy: false });
			}),
	);
}

/** "Move to …" and "Also file in …" with a folder search. */
export function add_file_in_items(
	menu: Menu,
	app: App,
	key: string,
	index: StructureIndex,
	path: string,
	parent: string | null,
): void {
	const move = mover(app, key, index, path, parent);
	const pick = (copy: boolean) => {
		const filed_in = index.parents.get(path) ?? [];
		new FolderPickModal(
			app,
			index,
			(folder) => !is_within(index, path, folder) && !filed_in.includes(folder),
			(folder) => move({ to: folder, anchor: null, copy }),
		).open();
	};
	menu.addItem((item) =>
		item
			.setTitle(t('menu.move_to'))
			.setIcon('folder-input')
			.onClick(() => pick(false)),
	);
	if (parent === null) return;
	menu.addItem((item) =>
		item
			.setTitle(t('menu.also_file_in'))
			.setIcon('copy-plus')
			.onClick(() => pick(true)),
	);
}
