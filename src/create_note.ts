import { type App, normalizePath, Notice, TFile, TFolder } from 'obsidian';
import { t } from './i18n';
import { NewNoteModal, type NewNoteInput } from './new_note_modal';
import { add_child } from './structure_actions';
import { build_note_content, timestamp_id, unique_name } from './note_naming';
import type { PluginSettings } from './settings';

/** Create missing folders along a path. */
async function ensure_folder(app: App, path: string): Promise<void> {
	let current = '';
	for (const segment of path.split('/').filter((part) => part !== '')) {
		current = current === '' ? segment : `${current}/${segment}`;
		const existing = app.vault.getAbstractFileByPath(current);
		if (existing instanceof TFolder) continue;
		if (existing) throw new Error(`Not a folder: ${current}`);
		await app.vault.createFolder(current);
	}
}

/** Create the note file with a free name and open it. */
async function create_note(app: App, settings: PluginSettings, is_folder: boolean, input: NewNoteInput): Promise<TFile> {
	const folder = normalizePath(settings.newNoteFolder);
	await ensure_folder(app, settings.newNoteFolder);
	const path_for = (name: string): string => normalizePath(folder === '/' ? `${name}.md` : `${folder}/${name}.md`);
	const is_taken = (name: string): boolean => app.vault.getAbstractFileByPath(path_for(name)) !== null;
	const base = input.file_name ?? timestamp_id(new Date());
	const name = unique_name(base, is_taken);
	const content = build_note_content(input.title, is_folder ? settings.structureKey : null);
	const file = await app.vault.create(path_for(name), content);
	await app.workspace.getLeaf(false).openFile(file);
	return file;
}

/**
 * Ask for title (and file name if configured), then create and open a new note or folder note.
 * With `parent`, the new note is appended to that folder's structure list.
 */
export function open_new_note_dialog(
	app: App,
	settings: PluginSettings,
	is_folder: boolean,
	parent: TFile | null = null,
): void {
	new NewNoteModal(app, is_folder, settings.fileNaming === 'ask', (input) => {
		void (async () => {
			try {
				const file = await create_note(app, settings, is_folder, input);
				if (parent) await add_child(app, settings.structureKey, parent, file);
			} catch (error) {
				console.error('moc-tree: creating note failed', error);
				new Notice(t('notice.create_failed'));
			}
		})();
	}).open();
}
