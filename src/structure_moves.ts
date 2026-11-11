import { type App, Notice, type TFile } from 'obsidian';
import { t } from './i18n';
import { place_list_item, remove_entry } from './list_placement';
import { wiki_link_path } from './plain_link';
import { child_item, edit_file, file_at } from './structure_actions';
import { is_within, type StructureIndex } from './structure_index';

/** A move in the tree: take `path` from folder `from` and put it into folder `to`. */
export interface MoveRequest {
	path: string;
	/** Folder the entry is taken from; null for top level and orphans. */
	from: string | null;
	/** Target folder; null removes the entry from `from` only. */
	to: string | null;
	/** Neighbour in the target folder; null = end of the list. */
	anchor: { path: string; after: boolean } | null;
	/** Keep the entry in `from` as well. */
	copy: boolean;
}

/** Why a move is not possible, or null if it is fine. */
export function move_problem(index: StructureIndex, request: MoveRequest): string | null {
	if (request.to !== null && is_within(index, request.path, request.to)) return t('notice.move_cycle');
	if (request.to === null && (request.from === null || request.copy)) return t('notice.move_nothing');
	return null;
}

/** Predicate for list values of `moc` that link to `target_path`. */
export function links_to(app: App, moc: TFile, target_path: string): (value: string) => boolean {
	return (value) => {
		const link_path = wiki_link_path(value);
		return link_path !== null && app.metadataCache.getFirstLinkpathDest(link_path, moc.path)?.path === target_path;
	};
}

/**
 * Apply a move. The target is written first, so a failure on the second file leaves the
 * entry filed twice instead of lost.
 */
export async function move_entry(app: App, key: string, index: StructureIndex, request: MoveRequest): Promise<void> {
	const problem = move_problem(index, request);
	if (problem !== null) {
		new Notice(problem);
		return;
	}
	const entry = file_at(app, request.path);
	if (!entry) return;
	const target = file_at(app, request.to);
	if (target) {
		const anchor = request.anchor;
		const placed = await edit_file(app, target, (text) =>
			place_list_item(text, key, {
				is_entry: links_to(app, target, entry.path),
				is_anchor: anchor ? links_to(app, target, anchor.path) : null,
				after: anchor?.after ?? false,
				new_value: child_item(app, entry, target),
			}),
		);
		if (!placed) return;
	}
	const source = file_at(app, request.from);
	if (source && !request.copy && source.path !== target?.path) {
		await edit_file(app, source, (text) => remove_entry(text, key, links_to(app, source, entry.path)));
	}
}
