import { is_within, type StructureIndex } from './structure_index';
import type { MoveRequest } from './structure_moves';

/** An entry picked with "Move" or "Also file in", waiting for "Put here" on a target. */
export interface PendingPut {
	path: string;
	/** Folder the entry was picked in; null for top level and orphans. */
	from: string | null;
	/** Keep the entry in `from` as well. */
	copy: boolean;
}

/**
 * Move for putting the pending entry at the end of folder `to` (null = orphans, i.e. only
 * remove from `from`), or null where it cannot go: into itself or a subfolder, into a folder
 * that already lists it, or to the orphans when nothing would be removed.
 */
export function put_request(index: StructureIndex, pending: PendingPut, to: string | null): MoveRequest | null {
	if (to === null) {
		if (pending.copy || pending.from === null) return null;
	} else if (is_within(index, pending.path, to) || (index.parents.get(pending.path) ?? []).includes(to)) {
		return null;
	}
	return { path: pending.path, from: pending.from, to, anchor: null, copy: pending.copy };
}

/** True while the pending entry still exists, is not trashed and sits where it was picked. */
export function pending_valid(index: StructureIndex, pending: PendingPut): boolean {
	if (!index.notes.has(pending.path) || index.in_trash.has(pending.path)) return false;
	if (pending.from === null) return true;
	return (index.children.get(pending.from) ?? []).some((child) => child.path === pending.path);
}

/** Holds the pending entry while the sidebar is open; not saved. */
export class TreeClipboard {
	private current: PendingPut | null = null;

	constructor(private readonly on_change: () => void) {}

	get pending(): PendingPut | null {
		return this.current;
	}

	/** Pick an entry, or clear with null; triggers a re-render. */
	set(pending: PendingPut | null): void {
		this.current = pending;
		this.on_change();
	}

	/** Silently drop the entry if it vanished or moved meanwhile (sync, delete). */
	revalidate(index: StructureIndex): void {
		if (this.current && !pending_valid(index, this.current)) this.current = null;
	}
}
