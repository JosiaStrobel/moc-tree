import { type App, Keymap, Menu, type PaneType, setIcon } from 'obsidian';
import type { ExpandStore } from './expand_store';
import {
	build_folder_tree,
	filter_folder_tree,
	folder_chain,
	folder_paths,
	type FileNode,
	type FolderFile,
	type FolderNode,
} from './folder_tree';
import { t } from './i18n';
import { read_title } from './structure_frontmatter';
import type { TreeClipboard } from './tree_clipboard';
import type { TreeDrag } from './tree_drag';
import { MAX_INDENT_DEPTH } from './tree_row';
import { render_section } from './tree_sections';

/** CSS class of the folders section. */
export const FOLDERS_SECTION = 'moc-tree-folders';

/** Trees of the shown real folders; missing or empty folders give no tree. Read-only, nothing is written. */
export function collect_folder_trees(app: App, shown: readonly string[]): FolderNode[] {
	if (shown.length === 0) return [];
	const files: FolderFile[] = [];
	for (const file of app.vault.getMarkdownFiles()) {
		if (!shown.some((root) => file.path.startsWith(`${root}/`))) continue;
		const title = read_title(app.metadataCache.getFileCache(file)?.frontmatter);
		files.push({ path: file.path, name: title ?? file.basename });
	}
	return shown.map((root) => build_folder_tree(root, files)).filter((tree) => tree.file_count > 0);
}

/** Trees reduced to the search hits; unchanged without a query. */
export function visible_folder_trees(trees: readonly FolderNode[], query: string): FolderNode[] {
	if (query.trim() === '') return [...trees];
	return trees.map((tree) => filter_folder_tree(tree, query)).filter((tree): tree is FolderNode => tree !== null);
}

/** All folder positions of the section, e.g. for "Collapse all". */
export function all_folder_keys(trees: readonly FolderNode[]): string[] {
	return trees.flatMap(folder_paths);
}

/** Expand the section and the folders down to a note; false if the note is in no shown folder. */
export function expand_to_folder_note(expand: ExpandStore, trees: readonly FolderNode[], path: string): boolean {
	const chain = folder_chain(
		trees.map((tree) => tree.path),
		path,
	);
	if (chain === null) return false;
	expand.set_folders_collapsed(false);
	expand.set(chain, true);
	return true;
}

/** What the folders section needs from the sidebar. */
export interface FolderSectionHost {
	app: App;
	expand: ExpandStore;
	/** Drag source for filing notes into folders (desktop only). */
	drag: TreeDrag | null;
	/** "Also file in" picks a note here; "Put here" on a folder files it. */
	clipboard: TreeClipboard;
	rerender: () => void;
}

/** Section with the shown real folders; `filtering` opens every folder and ignores the stored state. */
export function render_folders(
	parent_el: HTMLElement,
	host: FolderSectionHost,
	trees: readonly FolderNode[],
	filtering: boolean,
): void {
	if (trees.length === 0) return;
	render_section(parent_el, {
		cls: FOLDERS_SECTION,
		icon: 'folder-tree',
		heading: t('view.folders_heading'),
		count: trees.reduce((sum, tree) => sum + tree.file_count, 0),
		collapsed: !filtering && host.expand.folders_collapsed,
		toggle: () => {
			host.expand.set_folders_collapsed(!host.expand.folders_collapsed);
			host.rerender();
		},
		setup_header: () => {},
		render_rows: (el) => {
			for (const tree of trees) render_folder(el, host, tree, 0, filtering);
		},
	});
}

/** Create a row with the shared tree classes (listeners are added by the caller). */
function create_folder_row(item_el: HTMLElement, node: FolderNode | FileNode, depth: number, is_open: boolean): HTMLElement {
	const row = item_el.createDiv({ cls: 'tree-item-self is-clickable moc-tree-row' });
	row.addClass(node.kind === 'folder' ? 'moc-tree-moc' : 'moc-tree-note');
	row.toggleClass('is-open', is_open);
	row.dataset.depth = String(Math.min(depth, MAX_INDENT_DEPTH));
	row.dataset.key = node.path;
	if (node.kind === 'file') row.dataset.path = node.path;
	else setIcon(row.createDiv({ cls: 'moc-tree-row-icon' }), is_open ? 'folder-open' : 'folder');
	row.createDiv({ cls: 'tree-item-inner', text: node.name });
	if (node.kind === 'folder') row.createDiv({ cls: 'moc-tree-count', text: String(node.file_count) });
	return row;
}

/** One real folder; open folders render subfolders and notes. Shift-click toggles the whole subtree. */
function render_folder(parent_el: HTMLElement, host: FolderSectionHost, node: FolderNode, depth: number, filtering: boolean): void {
	const item = parent_el.createDiv({ cls: 'tree-item' });
	const is_open = filtering || host.expand.has(node.path);
	const row = create_folder_row(item, node, depth, is_open);
	const toggle_subtree = (open: boolean) => {
		host.expand.set(folder_paths(node), open);
		host.rerender();
	};
	row.addEventListener('click', (event) => {
		if (event.shiftKey) toggle_subtree(!is_open);
		else {
			host.expand.toggle(node.path);
			host.rerender();
		}
	});
	row.addEventListener('contextmenu', (event) => {
		event.preventDefault();
		const menu = new Menu();
		menu.addItem((entry) => entry.setTitle(t('menu.expand_all')).setIcon('chevrons-up-down').onClick(() => toggle_subtree(true)));
		menu.addItem((entry) => entry.setTitle(t('menu.collapse_all')).setIcon('chevrons-down-up').onClick(() => toggle_subtree(false)));
		menu.showAtMouseEvent(event);
	});
	if (!is_open) return;
	item.addClass('moc-tree-block');
	item.dataset.level = String(Math.min(depth + 1, MAX_INDENT_DEPTH));
	const children_el = item.createDiv({ cls: 'tree-item-children' });
	for (const child of node.children) {
		if (child.kind === 'folder') render_folder(children_el, host, child, depth + 1, filtering);
		else render_file(children_el, host, child, depth + 1);
	}
}

/**
 * One note row: click opens it, modifier click or the menu opens a new tab. Dragging it onto a
 * folder or "Also file in" files it in a MOC; the note itself stays untouched.
 */
function render_file(parent_el: HTMLElement, host: FolderSectionHost, node: FileNode, depth: number): void {
	const row = create_folder_row(parent_el.createDiv({ cls: 'tree-item' }), node, depth, false);
	host.drag?.attach_source(row, node.path, null);
	const pending = host.clipboard.pending;
	if (pending?.path === node.path && pending.name !== undefined) row.addClass('moc-tree-picked');
	const open = (new_tab: PaneType | boolean) => {
		const file = host.app.vault.getFileByPath(node.path);
		if (file) void host.app.workspace.getLeaf(new_tab).openFile(file);
	};
	row.addEventListener('click', (event) => open(Keymap.isModEvent(event)));
	row.addEventListener('contextmenu', (event) => {
		event.preventDefault();
		const menu = new Menu();
		menu.addItem((entry) => entry.setTitle(t('menu.open')).setIcon('file').onClick(() => open(false)));
		menu.addItem((entry) => entry.setTitle(t('menu.open_new_tab')).setIcon('file-plus').onClick(() => open(true)));
		menu.addSeparator();
		menu.addItem((entry) =>
			entry
				.setTitle(t('menu.also_file_in'))
				.setIcon('copy-plus')
				.onClick(() => host.clipboard.set({ path: node.path, from: null, copy: true, name: node.name })),
		);
		menu.showAtMouseEvent(event);
	});
}
