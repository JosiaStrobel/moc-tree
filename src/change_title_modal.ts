import { type App, Modal, Setting } from 'obsidian';
import { t } from './i18n';
import { clean_title } from './note_naming';

/** Dialog asking for a new title, prefilled with the current one. */
export class ChangeTitleModal extends Modal {
	private value: string;

	constructor(
		app: App,
		current: string,
		private readonly on_submit: (title: string) => void,
	) {
		super(app);
		this.value = current;
	}

	onOpen(): void {
		this.setTitle(t('modal.change_title.title'));
		new Setting(this.contentEl).setName(t('modal.new_note.note_title')).addText((text) => {
			text.setValue(this.value).onChange((value) => {
				this.value = value;
			});
			window.setTimeout(() => {
				text.inputEl.focus();
				text.inputEl.select();
			}, 0);
		});
		new Setting(this.contentEl).addButton((button) =>
			button
				.setButtonText(t('modal.change_title.save'))
				.setCta()
				.onClick(() => this.submit()),
		);
		this.scope.register([], 'Enter', (event) => {
			event.preventDefault();
			this.submit();
		});
	}

	onClose(): void {
		this.contentEl.empty();
	}

	/** Validate and hand over the title; keeps the dialog open if it is empty. */
	private submit(): void {
		const title = clean_title(this.value);
		if (title === null) {
			this.contentEl.querySelector('.moc-tree-modal-error')?.remove();
			this.contentEl.createDiv({ cls: 'moc-tree-modal-error', text: t('modal.new_note.title_required') });
			return;
		}
		this.close();
		this.on_submit(title);
	}
}
