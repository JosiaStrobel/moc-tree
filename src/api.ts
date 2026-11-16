import type { App, TFile } from 'obsidian';
import { ask_new_note, create_note_file } from './create_note';
import { clean_title } from './note_naming';
import type { PluginSettings } from './settings';

/** Options for `MocTreeApi.create_note`. */
export interface CreateNoteOptions {
	/** Show the new-note dialog prefilled with the title (default false). */
	interactive?: boolean;
	/** Open the created note (default false). */
	open?: boolean;
}

/** Public API for other plugins; `version` increases on breaking changes. */
export interface MocTreeApi {
	readonly version: 1;
	/**
	 * Create a managed note following the MOC Tree settings (folder, file naming, frontmatter).
	 * - interactive: show the new-note dialog prefilled with `title` (user may edit title,
	 *   synonyms, file name). Resolves null if the dialog is cancelled.
	 * - open: open the created note (default false; the caller decides).
	 * Throws on write errors; never overwrites existing files.
	 */
	create_note(title: string, options?: CreateNoteOptions): Promise<TFile | null>;
}

/** Build the API object; settings are read on each call so changes apply immediately. */
export function create_api(app: App, get_settings: () => PluginSettings): MocTreeApi {
	return {
		version: 1,
		async create_note(title: string, options: CreateNoteOptions = {}): Promise<TFile | null> {
			const settings = get_settings();
			let input;
			if (options.interactive) {
				input = await ask_new_note(app, settings, false, title);
				if (!input) return null;
			} else {
				const cleaned = clean_title(title);
				if (cleaned === null) throw new Error('MOC Tree: title must be a non-empty single line');
				input = { title: cleaned, synonyms: [], file_name: null };
			}
			const file = await create_note_file(app, settings, false, input);
			if (options.open) await app.workspace.getLeaf(false).openFile(file);
			return file;
		},
	};
}
