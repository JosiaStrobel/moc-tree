import type { App, Menu } from 'obsidian';
import { t } from './i18n';
import { is_trashed, type StructureIndex } from './structure_index';
import { move_entry, type MoveRequest } from './structure_moves';
import { put_request, type TreeClipboard } from './tree_clipboard';

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
	const siblings = (index.children.get(parent) ?? []).flatMap((child) =>
		child.path === null || is_trashed(index, child.path) ? [] : [child.path],
	);
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

/** "Move" and "Also file in": pick the entry; the target folder's menu then offers "Put here". */
export function add_pick_items(menu: Menu, clipboard: TreeClipboard, path: string, parent: string | null): void {
	menu.addItem((item) =>
		item
			.setTitle(t('menu.move_to'))
			.setIcon('folder-input')
			.onClick(() => clipboard.set({ path, from: parent, copy: false })),
	);
	if (parent === null) return;
	menu.addItem((item) =>
		item
			.setTitle(t('menu.also_file_in'))
			.setIcon('copy-plus')
			.onClick(() => clipboard.set({ path, from: parent, copy: true })),
	);
}

/**
 * "Put here" for the picked entry, into folder `to` (null = orphans); disabled where it cannot go.
 * Adds nothing and returns false while no entry is picked.
 */
export function add_put_item(
	menu: Menu,
	app: App,
	key: string,
	index: StructureIndex,
	clipboard: TreeClipboard,
	to: string | null,
): boolean {
	const pending = clipboard.pending;
	if (!pending) return false;
	const request = put_request(index, pending, to);
	menu.addItem((item) =>
		item
			.setTitle(t('menu.put_here'))
			.setIcon('clipboard-paste')
			.setDisabled(request === null)
			.onClick(() => {
				if (!request) return;
				clipboard.set(null);
				void move_entry(app, key, index, request);
			}),
	);
	return true;
}
