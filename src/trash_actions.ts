import { type App, getAllTags, Menu, Notice, type TFile } from 'obsidian';
import { ChoiceModal, type Choice } from './choice_modal';
import { t } from './i18n';
import { remove_entry } from './list_placement';
import type { PluginSettings } from './settings';
import { append_links, edit_file, file_at } from './structure_actions';
import { display_name, type StructureIndex, type TreeEntry } from './structure_index';
import { links_to } from './structure_moves';
import { add_trash_tag, has_trash_tag, is_trash_tag, remove_trash_tag } from './trash_tag';

/** True if the note carries the trash tag (frontmatter or text). */
export function file_is_trashed(app: App, settings: PluginSettings, file: TFile): boolean {
	const cache = app.metadataCache.getFileCache(file);
	return cache !== null && has_trash_tag(getAllTags(cache) ?? [], settings.trashTag);
}

/** Add the trash tag to the note's frontmatter. */
export async function move_to_trash(app: App, settings: PluginSettings, file: TFile): Promise<void> {
	await edit_file(app, file, (text) => add_trash_tag(text, settings.trashTag));
}

/** Remove the trash tag from the frontmatter; a tag in the note text has to be removed by hand. */
async function restore(app: App, settings: PluginSettings, file: TFile): Promise<void> {
	const in_text = app.metadataCache.getFileCache(file)?.tags?.some((tag) => is_trash_tag(tag.tag, settings.trashTag));
	const ok = await edit_file(app, file, (text) => remove_trash_tag(text, settings.trashTag));
	if (ok && in_text) new Notice(t('notice.trash_body_tag'));
}

/**
 * Delete a note: optionally move its children to `target` first, then remove its links from all
 * folders and trash the file the way Obsidian is configured to.
 */
async function delete_note(app: App, key: string, index: StructureIndex, file: TFile, target: TFile | null): Promise<void> {
	try {
		if (target && !(await append_links(app, key, target, index.children.get(file.path) ?? []))) return;
		for (const parent of index.parents.get(file.path) ?? []) {
			const moc = file_at(app, parent);
			if (moc) await edit_file(app, moc, (text) => remove_entry(text, key, links_to(app, moc, file.path)));
		}
		await app.fileManager.trashFile(file);
	} catch (error) {
		console.error('moc-tree: deleting note failed', error);
		new Notice(t('notice.delete_failed'));
	}
}

/** Ask before deleting; folders with entries offer to move them to a visible parent folder. */
function confirm_delete(app: App, settings: PluginSettings, index: StructureIndex, file: TFile): void {
	const note = index.notes.get(file.path);
	const name = note ? display_name(note) : file.basename;
	const count = index.children.get(file.path)?.length ?? 0;
	const key = settings.structureKey;
	const parent = file_at(app, (index.parents.get(file.path) ?? []).find((path) => !index.in_trash.has(path)) ?? null);
	const parent_note = parent ? index.notes.get(parent.path) : undefined;
	const choices: Choice[] = [];
	if (count > 0 && parent) {
		choices.push({
			label: t('modal.delete.with_parent', { parent: parent_note ? display_name(parent_note) : parent.basename }),
			cta: true,
			action: () => void delete_note(app, key, index, file, parent),
		});
	}
	choices.push({ label: t('modal.delete.confirm'), destructive: true, action: () => void delete_note(app, key, index, file, null) });
	const message = count > 0 ? t('modal.delete.desc_children', { name, count }) : t('modal.delete.desc', { name });
	new ChoiceModal(app, t('modal.delete.title'), message, choices).open();
}

/** Ask, then delete every trashed note; children without the tag stay. */
function confirm_empty_trash(app: App, settings: PluginSettings, index: StructureIndex): void {
	const files = [...index.notes.values()].filter((note) => note.trashed).flatMap((note) => file_at(app, note.path) ?? []);
	if (files.length === 0) return;
	const empty = async () => {
		for (const file of files) await delete_note(app, settings.structureKey, index, file, null);
	};
	new ChoiceModal(app, t('menu.empty_trash'), t('modal.empty_trash.desc', { count: files.length }), [
		{ label: t('modal.delete.confirm'), destructive: true, action: () => void empty() },
	]).open();
}

/** "Move to trash" or "Restore", depending on the note's state. */
export function add_trash_item(menu: Menu, app: App, settings: PluginSettings, file: TFile): void {
	const trashed = file_is_trashed(app, settings, file);
	menu.addItem((item) =>
		item
			.setTitle(t(trashed ? 'menu.restore' : 'menu.trash'))
			.setIcon(trashed ? 'rotate-ccw' : 'trash-2')
			.onClick(() => void (trashed ? restore(app, settings, file) : move_to_trash(app, settings, file))),
	);
}

/** Context menu for a row in the trash section: restore and delete (trashed notes), open. */
export function show_trash_menu(app: App, settings: PluginSettings, index: StructureIndex, entry: TreeEntry, event: MouseEvent): void {
	const file = file_at(app, entry.path);
	if (!file) return;
	const menu = new Menu();
	if (index.notes.get(file.path)?.trashed) {
		add_trash_item(menu, app, settings, file);
		menu.addItem((item) =>
			item
				.setTitle(t('menu.delete_forever'))
				.setIcon('trash-2')
				.setWarning(true)
				.onClick(() => confirm_delete(app, settings, index, file)),
		);
		menu.addSeparator();
	}
	menu.addItem((item) =>
		item
			.setTitle(t('menu.open'))
			.setIcon('file-input')
			.onClick(() => void app.workspace.getLeaf(false).openFile(file)),
	);
	menu.showAtMouseEvent(event);
}

/** Context menu of the trash section header. */
export function show_trash_section_menu(app: App, settings: PluginSettings, index: StructureIndex, event: MouseEvent): void {
	const menu = new Menu();
	menu.addItem((item) =>
		item
			.setTitle(t('menu.empty_trash'))
			.setIcon('trash-2')
			.setWarning(true)
			.setDisabled(index.trash.length === 0)
			.onClick(() => confirm_empty_trash(app, settings, index)),
	);
	menu.showAtMouseEvent(event);
}
