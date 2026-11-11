import { setIcon } from 'obsidian';
import { t } from './i18n';
import { display_name, type StructureIndex } from './structure_index';
import type { TreeClipboard } from './tree_clipboard';

/** Bar below the search naming the picked entry, with a cancel button; empty (and hidden) otherwise. */
export function render_pending_bar(bar: HTMLElement, index: StructureIndex, clipboard: TreeClipboard): void {
	bar.empty();
	const pending = clipboard.pending;
	const note = pending ? index.notes.get(pending.path) : undefined;
	if (!pending || !note) return;
	setIcon(bar.createDiv({ cls: 'moc-tree-row-icon' }), pending.copy ? 'copy-plus' : 'folder-input');
	const key = pending.copy ? 'view.pending_copy' : 'view.pending_move';
	bar.createDiv({ cls: 'moc-tree-pending-text', text: t(key, { name: display_name(note) }) });
	const cancel = bar.createDiv({ cls: 'clickable-icon', attr: { 'aria-label': t('modal.cancel') } });
	setIcon(cancel, 'x');
	cancel.addEventListener('click', () => clipboard.set(null));
}
