import { type App, Notice, TFile } from 'obsidian';
import { add_empty_list, insert_list_item, remove_key } from './frontmatter_lines';
import { t } from './i18n';
import type { ChildLink } from './structure_index';

/**
 * Apply a line-based edit to a file. Writes only if the text really changes;
 * shows a notice and returns false if the frontmatter cannot be edited safely.
 */
export async function edit_file(app: App, file: TFile, edit: (text: string) => string | null): Promise<boolean> {
	const current = await app.vault.cachedRead(file);
	const preview = edit(current);
	let ok = preview !== null;
	if (ok && preview !== current) {
		await app.vault.process(file, (text) => {
			const next = edit(text);
			if (next === null) ok = false;
			return next ?? text;
		});
	}
	if (!ok) new Notice(t('notice.unsafe_frontmatter', { name: file.basename }));
	return ok;
}

/** Structure-list entry for a file, as seen from the MOC that lists it: `[[link text]]`. */
export function child_item(app: App, child: TFile, moc: TFile): string {
	return `[[${app.metadataCache.fileToLinktext(child, moc.path, true)}]]`;
}

/** Structure-list entry for an existing child link, keeping dead links as written. */
function item_for_link(app: App, link: ChildLink, moc: TFile): string {
	const file = link.path === null ? null : app.vault.getFileByPath(link.path);
	return file ? child_item(app, file, moc) : `[[${link.link}]]`;
}

/** Append a note to the end of a MOC's structure list. */
export async function add_child(app: App, key: string, moc: TFile, child: TFile): Promise<boolean> {
	const item = child_item(app, child, moc);
	return edit_file(app, moc, (text) => insert_list_item(text, key, item));
}

/** Turn a note into a folder by adding an empty structure list. */
export async function convert_to_folder(app: App, key: string, file: TFile): Promise<boolean> {
	return edit_file(app, file, (text) => add_empty_list(text, key));
}

/**
 * Turn a folder back into a note. If `target` is given, its children are first appended to the
 * target's list, so a failed second write leaves them filed twice instead of lost.
 */
export async function convert_to_note(
	app: App,
	key: string,
	file: TFile,
	children: readonly ChildLink[],
	target: TFile | null,
): Promise<boolean> {
	if (target) {
		const items = children
			.filter((child) => child.path !== target.path)
			.map((child) => item_for_link(app, child, target));
		const moved = await edit_file(app, target, (text) => {
			let next: string | null = text;
			for (const item of items) next = next === null ? null : insert_list_item(next, key, item);
			return next;
		});
		if (!moved) return false;
	}
	return edit_file(app, file, (text) => remove_key(text, key));
}

/** File for a path, or null if it does not exist (anymore). */
export function file_at(app: App, path: string | null): TFile | null {
	const file = path === null ? null : app.vault.getAbstractFileByPath(path);
	return file instanceof TFile ? file : null;
}
