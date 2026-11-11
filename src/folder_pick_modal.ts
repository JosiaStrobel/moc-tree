import { type App, FuzzySuggestModal } from 'obsidian';
import { t } from './i18n';
import { display_name, type StructureIndex } from './structure_index';

/** Fuzzy search over folder notes (MOCs) by title. */
export class FolderPickModal extends FuzzySuggestModal<string> {
	constructor(
		app: App,
		private readonly index: StructureIndex,
		private readonly allowed: (folder: string) => boolean,
		private readonly on_pick: (folder: string) => void,
	) {
		super(app);
		this.setPlaceholder(t('modal.folder_pick.placeholder'));
	}

	getItems(): string[] {
		return [...this.index.children.keys()]
			.filter((path) => this.index.notes.get(path)?.managed && this.allowed(path))
			.sort((a, b) => this.getItemText(a).localeCompare(this.getItemText(b)));
	}

	getItemText(path: string): string {
		const note = this.index.notes.get(path);
		return note ? display_name(note) : path;
	}

	onChooseItem(path: string): void {
		this.on_pick(path);
	}
}
