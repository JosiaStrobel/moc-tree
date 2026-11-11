import type { App, Menu, TFile } from 'obsidian';
import { ChangeTitleModal } from './change_title_modal';
import { set_scalar } from './frontmatter_lines';
import { t } from './i18n';
import { edit_file } from './structure_actions';
import { read_title } from './structure_frontmatter';
import { sync_title_alias } from './title_aliases';

/** Set a new title and update the aliases in one write. */
async function write_title(app: App, file: TFile, old_title: string | null, title: string): Promise<void> {
	await edit_file(app, file, (text) => {
		const with_title = set_scalar(text, 'title', title);
		return with_title === null ? null : sync_title_alias(with_title, old_title, title);
	});
}

/** Ask for a new title of a note and write it. */
export function open_change_title_dialog(app: App, file: TFile): void {
	const old_title = read_title(app.metadataCache.getFileCache(file)?.frontmatter);
	new ChangeTitleModal(app, old_title ?? file.basename, (title) => {
		if (title === old_title) return;
		void write_title(app, file, old_title, title).catch((error: unknown) => {
			console.error('moc-tree: changing title failed', error);
		});
	}).open();
}

/** Add "Change title" to a menu. */
export function add_change_title_item(menu: Menu, app: App, file: TFile): void {
	menu.addItem((item) =>
		item
			.setTitle(t('menu.change_title'))
			.setIcon('pencil')
			.onClick(() => open_change_title_dialog(app, file)),
	);
}
