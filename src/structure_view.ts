import { ItemView, Keymap, Notice, Platform, SearchComponent, type TFile, type WorkspaceLeaf } from 'obsidian';
import { check_structure } from './check_structure';
import { DoubleClickTracker } from './double_click';
import { position_key } from './expand_state';
import { ExpandStore } from './expand_store';
import { t } from './i18n';
import { type PluginSettings, TREE_SIZES } from './settings';
import { child_entries, describe_note, type StructureIndex, type TreeEntry } from './structure_index';
import type { StructureStore } from './structure_store';
import { TreeClipboard } from './tree_clipboard';
import { TreeDrag } from './tree_drag';
import { build_search_filter, find_positions, type SearchFilter } from './tree_find';
import { subtree_keys } from './tree_keys';
import { find_row, flash_row, mark_active_rows } from './tree_active';
import { show_entry_menu } from './tree_menu';
import { render_pending_bar } from './tree_pending_bar';
import { create_row, MAX_INDENT_DEPTH } from './tree_row';
import { render_orphans, render_trash, type SectionHost } from './tree_sections';
import { render_toolbar } from './tree_toolbar';
import { show_trash_menu } from './trash_actions';

export const STRUCTURE_VIEW_TYPE = 'moc-tree-structure';

/** Maximum number of search hits shown. */
const MAX_SEARCH_HITS = 500;

/**
 * Sidebar with search, the MOC tree, the orphan list and the trash.
 * Row listeners are attached to row elements directly; they are dropped with the rows on re-render.
 */
export class StructureView extends ItemView {
	private readonly expand: ExpandStore;
	/** Drag and drop on desktop only; touch uses the context menu. */
	private readonly drag: TreeDrag | null;
	private readonly clicks = new DoubleClickTracker();
	/** Entry picked with "Move" or "Also file in", put with "Put here" (touch-friendly moving). */
	private readonly clipboard = new TreeClipboard(() => this.render());
	private pending_el: HTMLElement | null = null;
	private search: SearchComponent | null = null;
	private tree_el: HTMLElement | null = null;
	private query = '';
	/** Last revealed note and position, so repeated reveals cycle through all positions. */
	private reveal_cursor: { path: string; position: number } | null = null;

	constructor(
		leaf: WorkspaceLeaf,
		private readonly store: StructureStore,
		private readonly get_settings: () => PluginSettings,
	) {
		super(leaf);
		this.expand = new ExpandStore(this.app);
		this.drag = Platform.isMobile ? null : new TreeDrag(this.app, get_settings, () => this.store.get_index());
		this.drag?.attach_keys(this);
	}

	getViewType(): string {
		return STRUCTURE_VIEW_TYPE;
	}

	getDisplayText(): string {
		return t('view.title');
	}

	getIcon(): string {
		return 'list-tree';
	}

	async onOpen(): Promise<void> {
		this.expand.load();
		this.contentEl.empty();
		this.contentEl.addClass('moc-tree-view');
		const header = this.contentEl.createDiv({ cls: 'moc-tree-header' });
		render_toolbar(header, [
			{
				icon: 'locate-fixed',
				label: t('command.reveal_active'),
				action: () => {
					const file = this.app.workspace.getActiveFile();
					if (file) this.reveal(file.path);
				},
			},
			{ icon: 'chevrons-down-up', label: t('view.collapse_all'), action: () => this.collapse_all() },
			{
				icon: 'shield-check',
				label: t('command.check_structure'),
				action: () => void check_structure(this.app, this.store, this.get_settings().structureKey),
			},
		]);
		this.search = new SearchComponent(header).setPlaceholder(t('view.search_placeholder')).onChange((value) => {
			this.query = value;
			this.render();
		});
		this.pending_el = header.createDiv({ cls: 'moc-tree-pending-bar' });
		this.tree_el = this.contentEl.createDiv({ cls: 'moc-tree-tree' });
		this.registerDomEvent(this.contentEl, 'keydown', (event) => {
			if (event.key === 'Escape' && this.clipboard.pending) this.clipboard.set(null);
		});
		this.register(this.store.on_change(() => this.render()));
		this.registerEvent(this.app.vault.on('rename', (file, old_path) => this.expand.rename(old_path, file.path)));
		this.registerEvent(this.app.workspace.on('file-open', () => this.mark_active()));
		this.render();
		await Promise.resolve();
	}

	/** Collapse every folder in the tree. */
	private collapse_all(): void {
		const index = this.store.get_index();
		this.expand.set(
			index.roots.flatMap((root) => subtree_keys(index, [], root)),
			false,
		);
		this.render();
	}

	/** Show a note in the tree: expand the way to it, scroll there and highlight it. */
	reveal(path: string): void {
		this.search?.setValue('');
		this.query = '';
		const index = this.store.get_index();
		const positions = find_positions(index, path);
		if (positions.length === 0) {
			const section = index.orphans.includes(path) ? 'moc-tree-orphans' : index.in_trash.has(path) ? 'moc-tree-trash' : null;
			if (section === 'moc-tree-orphans') this.expand.set_orphans_collapsed(false);
			if (section === 'moc-tree-trash') this.expand.set_trash_collapsed(false);
			this.render();
			if (section === null) new Notice(t('notice.reveal_missing'));
			else if (this.tree_el) flash_row(find_row(this.tree_el, position_key([], path), section));
			return;
		}
		const cursor = this.reveal_cursor;
		const position = cursor?.path === path ? (cursor.position + 1) % positions.length : 0;
		this.reveal_cursor = { path, position };
		const chain = positions[position] ?? [];
		this.expand.set(
			chain.map((folder, depth) => position_key(chain.slice(0, depth), folder)),
			true,
		);
		this.render();
		if (this.tree_el) flash_row(find_row(this.tree_el, position_key(chain, path)));
	}

	/** Mark the active note and the way to it. */
	private mark_active(): void {
		if (this.tree_el) mark_active_rows(this.tree_el, this.app.workspace.getActiveFile()?.path);
	}

	/** Rebuild the tree from the current index and search. */
	private render(): void {
		const tree_el = this.tree_el;
		if (!tree_el) return;
		const index = this.store.get_index();
		tree_el.empty();
		this.clipboard.revalidate(index);
		if (this.pending_el) render_pending_bar(this.pending_el, index, this.clipboard);
		for (const size of TREE_SIZES) this.contentEl.toggleClass(`mod-size-${size}`, size === this.get_settings().treeSize);

		if (index.roots.length === 0 && index.orphans.length === 0 && index.trash.length === 0) {
			tree_el.createDiv({ cls: 'pane-empty', text: t('view.empty') });
			return;
		}
		const filter = build_search_filter(index, this.query, MAX_SEARCH_HITS);
		if (filter && filter.matches.size === 0) {
			tree_el.createDiv({ cls: 'pane-empty', text: t('view.no_results') });
			return;
		}
		for (const root of index.roots) {
			this.render_entry(tree_el, index, describe_note(index, root), [], filter)?.addClass('moc-tree-root');
		}
		const host = this.section_host(index);
		render_orphans(tree_el, host, filter);
		// Search skips trashed notes, so the trash is only shown without a query.
		if (!filter && index.trash.length > 0) render_trash(tree_el, host);
		this.mark_active();
	}

	/** What the orphan and trash sections need from the sidebar. */
	private section_host(index: StructureIndex): SectionHost {
		return {
			app: this.app,
			settings: this.get_settings(),
			index,
			expand: this.expand,
			drag: this.drag,
			clipboard: this.clipboard,
			rerender: () => this.render(),
			render_row: (el, path, filter, in_trash) =>
				this.render_entry(el, index, describe_note(index, path), [], filter, in_trash),
		};
	}

	/** One row with icon, name, markers and child count; expanded folders render their children. */
	private render_entry(
		parent_el: HTMLElement,
		index: StructureIndex,
		entry: TreeEntry,
		ancestors: readonly string[],
		filter: SearchFilter | null,
		in_trash = false,
	): HTMLElement | null {
		const path = entry.path;
		if (filter && (path === null || !(filter.matches.has(path) || filter.ancestors.has(path)))) return null;
		const item = parent_el.createDiv({ cls: 'tree-item' });
		const parent = ancestors[ancestors.length - 1] ?? null;
		const key = path === null ? null : position_key(ancestors, path);
		const expandable = entry.kind === 'moc' && key !== null;
		const is_open = expandable && (this.expand.has(key) || (path !== null && (filter?.ancestors.has(path) ?? false)));
		const chain = path === null ? ancestors : [...ancestors, path];
		const children = entry.kind === 'moc' && path !== null ? child_entries(index, path, new Set(chain), in_trash) : [];
		const row = create_row(item, index, entry, {
			key,
			depth: ancestors.length,
			parent,
			is_open,
			is_match: path !== null && (filter?.matches.has(path) ?? false),
			child_count: children.length,
		});
		if (!in_trash) this.drag?.attach_row(row, entry, parent);
		const pending = this.clipboard.pending;
		if (!in_trash && pending?.path === path && pending.from === parent) row.addClass('moc-tree-picked');
		row.addEventListener('click', (event) => {
			if (expandable) this.click_folder(index, ancestors, key, entry, event);
			else this.open_entry(entry, event);
		});
		row.addEventListener('contextmenu', (event) => {
			event.preventDefault();
			if (in_trash) {
				show_trash_menu(this.app, this.get_settings(), index, entry, event);
				return;
			}
			const toggle =
				expandable && path !== null
					? (expand: boolean) => this.toggle_subtree(subtree_keys(index, ancestors, path), expand)
					: null;
			show_entry_menu(this.app, this.get_settings(), index, this.clipboard, entry, parent, event, toggle);
		});

		if (is_open && path !== null) {
			const children_el = item.createDiv({ cls: 'tree-item-children' });
			// The whole open folder (header row and children) forms one surface, shaded by level.
			item.addClass('moc-tree-block');
			item.dataset.level = String(Math.min(chain.length, MAX_INDENT_DEPTH));
			for (const child of children) this.render_entry(children_el, index, child, chain, filter, in_trash);
		}
		return item;
	}

	/**
	 * Click on a folder: toggle it; Shift toggles the whole subtree; a double click (or modifier
	 * click) opens the folder note. The second click of a double click undoes the first toggle.
	 */
	private click_folder(
		index: StructureIndex,
		ancestors: readonly string[],
		key: string,
		entry: TreeEntry,
		event: MouseEvent,
	): void {
		if (event.shiftKey && entry.path !== null) {
			event.preventDefault();
			this.toggle_subtree(subtree_keys(index, ancestors, entry.path), !this.expand.has(key));
			return;
		}
		if (Keymap.isModEvent(event)) {
			this.open_entry(entry, event);
			return;
		}
		const is_double = this.clicks.click(key, event.timeStamp);
		this.expand.toggle(key);
		this.render();
		if (is_double) this.open_entry(entry, event);
	}

	/** Expand or collapse a set of tree positions at once. */
	private toggle_subtree(keys: readonly string[], expand: boolean): void {
		this.expand.set(keys, expand);
		this.render();
	}

	/** Open the note of a row; modifier click opens a new tab. */
	private open_entry(entry: TreeEntry, event: MouseEvent): void {
		const file: TFile | null = entry.path === null ? null : this.app.vault.getFileByPath(entry.path);
		if (!file) {
			new Notice(t('view.marker.dead'));
			return;
		}
		void this.app.workspace.getLeaf(Keymap.isModEvent(event)).openFile(file);
	}
}
