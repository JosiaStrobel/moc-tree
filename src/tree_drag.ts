import type { App, Component } from 'obsidian';
import type { PluginSettings } from './settings';
import type { StructureIndex, TreeEntry } from './structure_index';
import { move_entry, move_problem, type MoveRequest } from './structure_moves';

/** Where a row was hit while dragging. */
type Zone = 'before' | 'after' | 'into';

const ZONE_CLASSES = [
	'moc-tree-drop-before',
	'moc-tree-drop-after',
	'moc-tree-drop-into',
	'moc-tree-drop-invalid',
	'moc-tree-drop-copy',
];

/** Remove all drop indicators from an element. */
function clear_indicator(el: HTMLElement): void {
	el.removeClasses(ZONE_CLASSES);
}

/**
 * Native HTML5 drag and drop for tree rows (desktop). Listeners sit on row elements and
 * disappear with them on re-render.
 */
export class TreeDrag {
	private dragging: { path: string; from: string | null } | null = null;
	/** Move shown during the last dragover; the drop applies exactly this. */
	private last_move: MoveRequest | null = null;
	/** Ctrl/Cmd state from key events; drag events on Linux often lack modifier flags. */
	private copy_key_down = false;
	/** Ctrl/Cmd held when the mouse button went down on the dragged row (reliable everywhere). */
	private copy_at_start = false;

	constructor(
		private readonly app: App,
		private readonly get_settings: () => PluginSettings,
		private readonly get_index: () => StructureIndex,
	) {}

	/** Track Ctrl/Cmd on the window; listeners are released with the component. */
	attach_keys(component: Component): void {
		const track = (event: KeyboardEvent) => {
			if (event.key === 'Control' || event.key === 'Meta') this.copy_key_down = event.type === 'keydown';
		};
		component.registerDomEvent(window, 'keydown', track, { capture: true });
		component.registerDomEvent(window, 'keyup', track, { capture: true });
		// Focus moves away during a drag on some systems (Wayland); keep the state until it ends.
		component.registerDomEvent(window, 'blur', () => {
			if (!this.dragging) this.copy_key_down = false;
		});
	}

	/**
	 * Ctrl (Cmd on macOS) files the entry additionally instead of moving it. Several signals,
	 * since drag events on Linux often lack modifier flags: event flags, tracked key state, and
	 * the browser's own copy suggestion in `dropEffect` (read before it is overwritten).
	 */
	private wants_copy(event: DragEvent): boolean {
		const suggested = event.type === 'dragover' && event.dataTransfer?.dropEffect === 'copy';
		return event.ctrlKey || event.metaKey || this.copy_key_down || this.copy_at_start || suggested;
	}

	/** Make a row draggable and a drop target. `parent` is the folder the row sits in. */
	attach_row(row: HTMLElement, entry: TreeEntry, parent: string | null): void {
		const path = entry.path;
		if (path === null) return;
		row.draggable = true;
		row.addEventListener('pointerdown', (event) => {
			this.copy_at_start = event.ctrlKey || event.metaKey;
		});
		row.addEventListener('dragstart', (event) => {
			this.dragging = { path, from: parent };
			if (event.ctrlKey || event.metaKey) this.copy_key_down = true;
			const file = this.app.vault.getFileByPath(path);
			if (file && event.dataTransfer) {
				event.dataTransfer.effectAllowed = 'copyMove';
				event.dataTransfer.setData('text/plain', `[[${this.app.metadataCache.fileToLinktext(file, '', true)}]]`);
			}
		});
		row.addEventListener('dragend', () => {
			this.dragging = null;
			this.last_move = null;
			this.copy_at_start = false;
		});
		this.attach_target(row, (event) => this.row_request(event, row, entry, parent));
	}

	/** Make an element (e.g. the orphan header) a target that removes the entry from its folder. */
	attach_unfile_target(el: HTMLElement): void {
		this.attach_target(el, (event) => {
			const dragging = this.dragging;
			if (!dragging) return null;
			return { path: dragging.path, from: dragging.from, to: null, anchor: null, copy: this.wants_copy(event) };
		});
	}

	/** Drop handling shared by rows and sections; `request` builds the move for the pointer position. */
	private attach_target(
		el: HTMLElement,
		request: (event: DragEvent) => (MoveRequest & { zone?: Zone }) | null,
	): void {
		el.addEventListener('dragover', (event) => {
			const move = request(event);
			clear_indicator(el);
			this.last_move = move;
			if (!move) return;
			event.preventDefault();
			const problem = move_problem(this.get_index(), move);
			if (event.dataTransfer) event.dataTransfer.dropEffect = move.copy ? 'copy' : 'move';
			el.addClass(problem === null ? `moc-tree-drop-${move.zone ?? 'into'}` : 'moc-tree-drop-invalid');
			if (problem === null && move.copy) el.addClass('moc-tree-drop-copy');
		});
		el.addEventListener('dragleave', (event) => {
			// Moving onto a child element also fires dragleave; only clear when really leaving.
			const next = event.relatedTarget;
			if (next instanceof Node && el.contains(next)) return;
			clear_indicator(el);
		});
		el.addEventListener('drop', (event) => {
			clear_indicator(el);
			const move = this.last_move ?? request(event);
			this.dragging = null;
			this.last_move = null;
			if (!move) return;
			event.preventDefault();
			void move_entry(this.app, this.get_settings().structureKey, this.get_index(), move);
		});
	}

	/** Move for a drop on a row: into a folder, or before/after the row in the row's folder. */
	private row_request(
		event: DragEvent,
		row: HTMLElement,
		entry: TreeEntry,
		parent: string | null,
	): (MoveRequest & { zone: Zone }) | null {
		const dragging = this.dragging;
		if (!dragging || entry.path === null || entry.path === dragging.path) return null;
		const rect = row.getBoundingClientRect();
		const y = (event.clientY - rect.top) / Math.max(rect.height, 1);
		let zone: Zone = y < 0.5 ? 'before' : 'after';
		if (entry.kind === 'moc') zone = y < 0.25 ? 'before' : y > 0.75 ? 'after' : 'into';
		const to = zone === 'into' ? entry.path : parent;
		const anchor = zone === 'into' || parent === null ? null : { path: entry.path, after: zone === 'after' };
		const copy = this.wants_copy(event) && to !== dragging.from;
		return { path: dragging.path, from: dragging.from, to, anchor, copy, zone };
	}
}
