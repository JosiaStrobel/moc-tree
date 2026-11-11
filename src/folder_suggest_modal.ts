import { type App, FuzzySuggestModal, type TFolder } from 'obsidian';
import { t } from './i18n';

/** Fuzzy picker over all vault folders except the root. */
export class FolderSuggestModal extends FuzzySuggestModal<TFolder> {
	constructor(
		app: App,
		private readonly on_choose: (folder: TFolder) => void,
	) {
		super(app);
		this.setPlaceholder(t('modal.folder.placeholder'));
	}

	getItems(): TFolder[] {
		return this.app.vault.getAllFolders(false);
	}

	getItemText(folder: TFolder): string {
		return folder.path;
	}

	onChooseItem(folder: TFolder): void {
		this.on_choose(folder);
	}
}
