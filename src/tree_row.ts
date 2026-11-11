import { setIcon } from 'obsidian';
import type { StructureIndex, TreeEntry } from './structure_index';
import { render_markers } from './tree_markers';

/** Deepest level with its own indentation step in the stylesheet. */
export const MAX_INDENT_DEPTH = 12;

/** Row icon per kind; folders show an open folder while expanded. */
/** Plain notes get no icon; their name starts where a folder's icon sits, under the parent's name. */
const ROW_ICONS: Record<TreeEntry['kind'], (open: boolean) => string | null> = {
	moc: (open) => (open ? 'folder-open' : 'folder'),
	note: () => null,
	dead: () => 'file-x',
	cycle: () => 'folder-sync',
};

/** How a row is shown at its position. */
export interface RowState {
	/** Tree position key; null for dead links. */
	key: string | null;
	depth: number;
	parent: string | null;
	is_open: boolean;
	is_match: boolean;
	child_count: number;
}

/** Create the row element with icon, name, markers and child count (listeners are added by the caller). */
export function create_row(item_el: HTMLElement, index: StructureIndex, entry: TreeEntry, state: RowState): HTMLElement {
	const row = item_el.createDiv({ cls: 'tree-item-self is-clickable moc-tree-row' });
	row.addClass(`moc-tree-${entry.kind}`);
	row.toggleClass('is-open', state.is_open);
	row.toggleClass('is-match', state.is_match);
	// Depth drives the indentation in CSS, so folder surfaces can span the full width.
	row.dataset.depth = String(Math.min(state.depth, MAX_INDENT_DEPTH));
	if (entry.path !== null && state.key !== null) {
		row.dataset.path = entry.path;
		row.dataset.key = state.key;
	}
	const icon = ROW_ICONS[entry.kind](state.is_open);
	if (icon !== null) setIcon(row.createDiv({ cls: 'moc-tree-row-icon' }), icon);
	row.createDiv({ cls: 'tree-item-inner', text: entry.name });
	render_markers(row, index, entry, state.parent);
	if (state.child_count > 0) row.createDiv({ cls: 'moc-tree-count', text: String(state.child_count) });
	return row;
}
