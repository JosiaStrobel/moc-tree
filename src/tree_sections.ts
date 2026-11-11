import { type App, Menu, setIcon } from 'obsidian';
import type { ExpandStore } from './expand_store';
import { t } from './i18n';
import type { PluginSettings } from './settings';
import type { StructureIndex } from './structure_index';
import { show_trash_section_menu } from './trash_actions';
import type { TreeClipboard } from './tree_clipboard';
import type { TreeDrag } from './tree_drag';
import type { SearchFilter } from './tree_find';
import { add_put_item } from './tree_menu_move';

/** A collapsible section below the tree (orphans, trash). */
export interface SectionSpec {
	/** CSS class of the section, e.g. `moc-tree-orphans`. */
	cls: string;
	icon: string;
	heading: string;
	count: number;
	collapsed: boolean;
	/** Flip the collapsed state (and re-render). */
	toggle: () => void;
	/** Extra listeners on the header, e.g. drop target or context menu. */
	setup_header: (header: HTMLElement) => void;
	/** Fill the open section with rows. */
	render_rows: (children_el: HTMLElement) => void;
}

/** Render a section header with icon, heading and count; rows only while open. */
export function render_section(parent_el: HTMLElement, spec: SectionSpec): void {
	const section = parent_el.createDiv({ cls: `tree-item moc-tree-section-block ${spec.cls}` });
	const header = section.createDiv({ cls: 'tree-item-self is-clickable moc-tree-section' });
	header.toggleClass('is-collapsed', spec.collapsed);
	setIcon(header.createDiv({ cls: 'moc-tree-row-icon' }), spec.icon);
	header.createDiv({ cls: 'tree-item-inner', text: spec.heading });
	header.createDiv({ cls: 'moc-tree-count', text: String(spec.count) });
	spec.setup_header(header);
	header.addEventListener('click', () => spec.toggle());
	if (!spec.collapsed) spec.render_rows(section.createDiv({ cls: 'tree-item-children' }));
}

/** What the orphan and trash sections need from the sidebar. */
export interface SectionHost {
	app: App;
	settings: PluginSettings;
	index: StructureIndex;
	expand: ExpandStore;
	drag: TreeDrag | null;
	clipboard: TreeClipboard;
	rerender: () => void;
	/** Render one top-level row for a note path. */
	render_row: (el: HTMLElement, path: string, filter: SearchFilter | null, in_trash: boolean) => void;
}

/** Section with all orphans; drop target and "Put here" target for removing from a folder. */
export function render_orphans(parent_el: HTMLElement, host: SectionHost, filter: SearchFilter | null): void {
	const { index, expand } = host;
	const orphans = filter ? index.orphans.filter((path) => filter.matches.has(path)) : index.orphans;
	if (filter && orphans.length === 0) return;
	render_section(parent_el, {
		cls: 'moc-tree-orphans',
		icon: 'inbox',
		heading: t('view.orphans_heading'),
		count: orphans.length,
		collapsed: !filter && expand.orphans_collapsed,
		toggle: () => {
			expand.set_orphans_collapsed(!expand.orphans_collapsed);
			host.rerender();
		},
		setup_header: (header) => {
			host.drag?.attach_unfile_target(header);
			header.addEventListener('contextmenu', (event) => {
				event.preventDefault();
				const menu = new Menu();
				const key = host.settings.structureKey;
				if (add_put_item(menu, host.app, key, index, host.clipboard, null)) menu.showAtMouseEvent(event);
			});
		},
		render_rows: (el) => {
			for (const path of orphans) host.render_row(el, path, filter, false);
		},
	});
}

/** Section with the trashed notes; its context menu empties the trash. */
export function render_trash(parent_el: HTMLElement, host: SectionHost): void {
	const { index, expand } = host;
	render_section(parent_el, {
		cls: 'moc-tree-trash',
		icon: 'trash-2',
		heading: t('view.trash_heading'),
		count: index.trash.length,
		collapsed: expand.trash_collapsed,
		toggle: () => {
			expand.set_trash_collapsed(!expand.trash_collapsed);
			host.rerender();
		},
		setup_header: (header) =>
			header.addEventListener('contextmenu', (event) => {
				event.preventDefault();
				show_trash_section_menu(host.app, host.settings, index, event);
			}),
		render_rows: (el) => {
			for (const path of index.trash) host.render_row(el, path, null, true);
		},
	});
}
