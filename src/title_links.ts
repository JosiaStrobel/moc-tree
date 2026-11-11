import { type App, getLinkpath, type MarkdownPostProcessorContext } from 'obsidian';
import type { StructureStore } from './structure_store';

/** Current title of the managed note a link points to, or null to keep the link as it is. */
export function linked_title(app: App, store: StructureStore, link: string, source_path: string): string | null {
	const file = app.metadataCache.getFirstLinkpathDest(getLinkpath(link), source_path);
	if (!file) return null;
	const note = store.get_index().notes.get(file.path);
	return note?.managed ? note.title : null;
}

/** Reading mode: show titles for internal links whose text is just the link target. */
export function title_link_post_processor(app: App, store: StructureStore) {
	return (el: HTMLElement, ctx: MarkdownPostProcessorContext): void => {
		for (const anchor of Array.from(el.querySelectorAll<HTMLAnchorElement>('a.internal-link'))) {
			const href = anchor.getAttribute('data-href');
			if (!href || anchor.textContent !== href || /[#^|]/.test(href)) continue;
			const title = linked_title(app, store, href, ctx.sourcePath);
			if (title !== null) anchor.setText(title);
		}
	};
}
