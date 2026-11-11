import { type App, Notice, type TFile } from 'obsidian';
import { read_list_items, remove_list_indices } from './frontmatter_lines';
import { t } from './i18n';
import { wiki_link_path } from './plain_link';
import { edit_file, file_at } from './structure_actions';
import { cycle_members, find_list_issues, type ListIssue } from './structure_check';
import { display_name } from './structure_index';
import { type FolderReport, StructureCheckModal } from './structure_check_modal';
import type { StructureStore } from './structure_store';

/** Resolve a list value of `moc` to the linked note's path, null if it points nowhere. */
function resolver(app: App, moc: TFile): (value: string) => string | null {
	return (value) => {
		const link_path = wiki_link_path(value);
		return link_path === null ? null : (app.metadataCache.getFirstLinkpathDest(link_path, moc.path)?.path ?? null);
	};
}

/** Read every managed folder note and collect its list issues. */
async function collect_reports(app: App, store: StructureStore, key: string): Promise<FolderReport[]> {
	const index = store.get_index();
	const reports: FolderReport[] = [];
	for (const path of index.children.keys()) {
		const note = index.notes.get(path);
		const file = file_at(app, path);
		if (!note?.managed || !file) continue;
		const values = read_list_items(await app.vault.cachedRead(file), key);
		if (values === null) continue;
		const issues = find_list_issues(values, resolver(app, file));
		if (issues.length > 0) reports.push({ file, name: display_name(note), issues });
	}
	return reports.sort((a, b) => a.name.localeCompare(b.name));
}

/** Remove the selected entries; skips entries whose position no longer holds the same value. */
async function clean(app: App, key: string, selection: ReadonlyMap<TFile, readonly ListIssue[]>): Promise<void> {
	let removed = 0;
	for (const [file, issues] of selection) {
		let count = 0;
		const ok = await edit_file(app, file, (text) => {
			const values = read_list_items(text, key);
			if (values === null) return null;
			const indices = issues.filter((issue) => values[issue.index] === issue.value).map((issue) => issue.index);
			count = indices.length;
			return remove_list_indices(text, key, indices);
		});
		if (ok) removed += count;
	}
	new Notice(t('check.done', { count: removed }));
}

/** Check all structure lists and offer to clean up duplicates and dead links. */
export async function check_structure(app: App, store: StructureStore, key: string): Promise<void> {
	try {
		const reports = await collect_reports(app, store, key);
		const index = store.get_index();
		const cycle_names = cycle_members(index).map((path) => {
			const note = index.notes.get(path);
			return note ? display_name(note) : path;
		});
		if (reports.length === 0 && cycle_names.length === 0) {
			new Notice(t('check.ok'));
			return;
		}
		new StructureCheckModal(app, reports, cycle_names, (selection) => void clean(app, key, selection)).open();
	} catch (error) {
		console.error('moc-tree: structure check failed', error);
		new Notice(t('notice.check_failed'));
	}
}
