import { type App, type Component, debounce, getAllTags, getLinkpath, type TFile } from 'obsidian';
import { managed_folders, is_in_folders } from './scope';
import type { PluginSettings } from './settings';
import { has_structure, read_aliases, read_title, structure_link_texts } from './structure_frontmatter';
import { has_trash_tag } from './trash_tag';
import { build_structure_index, type ChildLink, type NoteInput, type StructureIndex } from './structure_index';

/** Delay before rebuilding after file events, in ms. */
const REBUILD_DELAY_MS = 300;

/** Read one file's metadata into an index input. */
function read_note(app: App, file: TFile, managed: boolean, settings: PluginSettings): NoteInput {
	const key = settings.structureKey;
	const cache = app.metadataCache.getFileCache(file);
	const frontmatter = cache?.frontmatter;
	let children: ChildLink[] | null = null;
	if (has_structure(frontmatter, key)) {
		children = structure_link_texts(cache?.frontmatterLinks, key).map((link) => ({
			link,
			path: app.metadataCache.getFirstLinkpathDest(getLinkpath(link), file.path)?.path ?? null,
		}));
	}
	return {
		path: file.path,
		basename: file.basename,
		title: read_title(frontmatter),
		aliases: read_aliases(frontmatter),
		managed,
		children,
		trashed: cache ? has_trash_tag(getAllTags(cache) ?? [], settings.trashTag) : false,
	};
}

/** All managed notes plus the outside notes reachable through structure lists. */
export function collect_note_inputs(app: App, settings: PluginSettings): NoteInput[] {
	const folders = managed_folders(settings.newNoteFolder, settings.watchedFolders);
	const inputs = new Map<string, NoteInput>();
	for (const file of app.vault.getMarkdownFiles()) {
		if (is_in_folders(file.path, folders)) inputs.set(file.path, read_note(app, file, true, settings));
	}
	// Follow links leaving the managed folders, so moved notes keep their place in the tree.
	const pending = [...inputs.values()];
	while (pending.length > 0) {
		for (const child of pending.pop()?.children ?? []) {
			if (child.path === null || inputs.has(child.path)) continue;
			const file = app.vault.getFileByPath(child.path);
			if (!file) continue;
			const input = read_note(app, file, false, settings);
			inputs.set(file.path, input);
			pending.push(input);
		}
	}
	return [...inputs.values()];
}

/** Lazily built structure index that refreshes (debounced) on vault and metadata changes. */
export class StructureStore {
	private index: StructureIndex | null = null;
	private readonly listeners = new Set<() => void>();
	private readonly schedule_rebuild = debounce(() => this.invalidate(), REBUILD_DELAY_MS, true);

	constructor(
		private readonly app: App,
		private readonly get_settings: () => PluginSettings,
	) {}

	/** Hook into metadata and vault events; everything is released with the component. */
	attach(component: Component): void {
		const schedule = () => this.schedule_rebuild();
		component.registerEvent(this.app.metadataCache.on('changed', schedule));
		component.registerEvent(this.app.metadataCache.on('deleted', schedule));
		component.registerEvent(this.app.metadataCache.on('resolved', schedule));
		component.registerEvent(this.app.vault.on('rename', schedule));
		component.register(() => this.schedule_rebuild.cancel());
	}

	/** Current index; built on first access after a change. */
	get_index(): StructureIndex {
		this.index ??= build_structure_index(collect_note_inputs(this.app, this.get_settings()));
		return this.index;
	}

	/** Drop the cached index (e.g. after settings changes) and notify listeners. */
	invalidate(): void {
		this.index = null;
		for (const listener of this.listeners) listener();
	}

	/** Subscribe to index changes; returns the unsubscribe function. */
	on_change(listener: () => void): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}
}
