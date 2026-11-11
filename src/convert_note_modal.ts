import { type App, Modal, Setting } from 'obsidian';
import { t } from './i18n';

/** What happens to the children of a folder that becomes a note. */
export type ChildrenChoice = 'to_parent' | 'orphans';

/** Asks where the children go when a non-empty folder is turned into a note. */
export class ConvertNoteModal extends Modal {
	constructor(
		app: App,
		private readonly name: string,
		private readonly child_count: number,
		/** Name of the parent folder; null at the top level, where only "orphans" is offered. */
		private readonly parent_name: string | null,
		private readonly on_choose: (choice: ChildrenChoice) => void,
	) {
		super(app);
	}

	onOpen(): void {
		this.setTitle(t('modal.to_note.title'));
		this.contentEl.createEl('p', {
			text: t('modal.to_note.desc', { name: this.name, count: this.child_count }),
		});
		const buttons = new Setting(this.contentEl);
		if (this.parent_name !== null) {
			const parent = this.parent_name;
			buttons.addButton((button) =>
				button
					.setButtonText(t('modal.to_note.to_parent', { parent }))
					.setCta()
					.onClick(() => this.choose('to_parent')),
			);
		}
		buttons.addButton((button) =>
			button.setButtonText(t('modal.to_note.orphans')).onClick(() => this.choose('orphans')),
		);
		buttons.addButton((button) => button.setButtonText(t('modal.cancel')).onClick(() => this.close()));
	}

	/** Close and report the choice. */
	private choose(choice: ChildrenChoice): void {
		this.close();
		this.on_choose(choice);
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
