import { type App, Notice } from 'obsidian';
import { write_title } from './change_title';
import { t } from './i18n';
import { MissingTitlesModal, type TitleCandidate } from './missing_titles_modal';
import { file_at } from './structure_actions';
import { read_title } from './structure_frontmatter';
import type { StructureStore } from './structure_store';
import { propose_title } from './title_proposal';

/** Managed notes without title (trash excluded), with a proposal each, sorted by path. */
function collect_candidates(app: App, store: StructureStore): TitleCandidate[] {
	const index = store.get_index();
	const candidates: TitleCandidate[] = [];
	for (const note of index.notes.values()) {
		const file = note.managed && note.title === null && !note.trashed ? file_at(app, note.path) : null;
		if (!file) continue;
		const headings = app.metadataCache.getFileCache(file)?.headings;
		candidates.push({ file, title: propose_title(headings, file.basename), selected: true });
	}
	return candidates.sort((a, b) => a.file.path.localeCompare(b.file.path));
}

/** Write the chosen titles one note at a time; notes that got a title meanwhile are skipped. */
async function apply(app: App, chosen: readonly TitleCandidate[]): Promise<void> {
	let written = 0;
	const skipped: string[] = [];
	for (const { file, title } of chosen) {
		const current = read_title(app.metadataCache.getFileCache(file)?.frontmatter);
		if (current === null && (await write_title(app, file, null, title, false))) written++;
		else skipped.push(file.path);
	}
	if (skipped.length > 0) console.warn('moc-tree: titles not written for', skipped);
	new Notice(
		skipped.length > 0
			? t('titles.done_skipped', { count: written, skipped: skipped.length })
			: t('titles.done', { count: written }),
	);
}

/** Offer titles for all managed notes that have none. */
export function add_missing_titles(app: App, store: StructureStore): void {
	const candidates = collect_candidates(app, store);
	if (candidates.length === 0) {
		new Notice(t('titles.none'));
		return;
	}
	new MissingTitlesModal(app, candidates, (chosen) => {
		void apply(app, chosen).catch((error: unknown) => {
			console.error('moc-tree: adding titles failed', error);
			new Notice(t('notice.titles_failed'));
		});
	}).open();
}
