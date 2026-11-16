import { type App, Modal, Setting } from 'obsidian';
import { t } from './i18n';
import { clean_title, parse_synonyms, sanitize_file_name } from './note_naming';

/** Values entered in the new-note dialog. */
export interface NewNoteInput {
	title: string;
	/** Optional further aliases, without the title. */
	synonyms: string[];
	/** Chosen file name without extension; null when the naming scheme decides. */
	file_name: string | null;
}

/** Dialog asking for the title and, if configured, the file name of a new note. */
export class NewNoteModal extends Modal {
	private title_value = '';
	private synonyms_value = '';
	private file_name_value = '';
	private file_name_edited = false;
	private submitted = false;

	/** `on_done` is called once: with the input on submit, with null when the dialog is closed otherwise. */
	constructor(
		app: App,
		private readonly is_folder: boolean,
		private readonly ask_file_name: boolean,
		private readonly on_done: (input: NewNoteInput | null) => void,
		initial_title = '',
	) {
		super(app);
		this.title_value = initial_title;
	}

	onOpen(): void {
		this.setTitle(t(this.is_folder ? 'modal.new_folder.title' : 'modal.new_note.title'));
		let file_name_input: HTMLInputElement | undefined;

		new Setting(this.contentEl).setName(t('modal.new_note.note_title')).addText((text) => {
			text.setValue(this.title_value);
			text.onChange((value) => {
				this.title_value = value;
				if (file_name_input && !this.file_name_edited) {
					this.file_name_value = sanitize_file_name(value);
					file_name_input.value = this.file_name_value;
				}
			});
			window.setTimeout(() => text.inputEl.focus(), 0);
		});

		new Setting(this.contentEl)
			.setName(t('modal.new_note.synonyms'))
			.setDesc(t('modal.new_note.synonyms_desc'))
			.addText((text) => text.onChange((value) => (this.synonyms_value = value)));

		if (this.ask_file_name) {
			new Setting(this.contentEl).setName(t('modal.new_note.file_name')).addText((text) => {
				file_name_input = text.inputEl;
				this.file_name_value = sanitize_file_name(this.title_value);
				text.setValue(this.file_name_value);
				text.onChange((value) => {
					this.file_name_value = value;
					this.file_name_edited = true;
				});
			});
		}

		new Setting(this.contentEl).addButton((button) =>
			button
				.setButtonText(t('modal.new_note.create'))
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
		if (!this.submitted) this.on_done(null);
	}

	/** Validate the input and hand it over; keeps the dialog open on invalid input. */
	private submit(): void {
		const title = clean_title(this.title_value);
		if (title === null) {
			this.show_error(t('modal.new_note.title_required'));
			return;
		}
		let file_name: string | null = null;
		if (this.ask_file_name) {
			file_name = sanitize_file_name(this.file_name_value || title);
			if (file_name === '') {
				this.show_error(t('modal.new_note.file_name_invalid'));
				return;
			}
		}
		this.submitted = true;
		this.close();
		this.on_done({ title, synonyms: parse_synonyms(this.synonyms_value, title), file_name });
	}

	/** Show a validation message below the inputs. */
	private show_error(message: string): void {
		this.contentEl.querySelector('.moc-tree-modal-error')?.remove();
		this.contentEl.createDiv({ cls: 'moc-tree-modal-error', text: message });
	}
}
