import { type App, Modal, Setting, type TFile } from 'obsidian';
import { t } from './i18n';
import { clean_title } from './note_naming';

/** One note without title and the title to write. */
export interface TitleCandidate {
	file: TFile;
	title: string;
	selected: boolean;
}

/** Lists notes without title with an editable proposal and a checkbox each (all preselected). */
export class MissingTitlesModal extends Modal {
	constructor(
		app: App,
		private readonly candidates: TitleCandidate[],
		private readonly on_apply: (chosen: readonly TitleCandidate[]) => void,
	) {
		super(app);
	}

	onOpen(): void {
		this.setTitle(t('command.add_missing_titles'));
		this.contentEl.createEl('p', { text: t('titles.desc', { count: this.candidates.length }) });
		for (const candidate of this.candidates) {
			new Setting(this.contentEl)
				.setDesc(candidate.file.path)
				.addText((text) =>
					text.setValue(candidate.title).onChange((value) => {
						candidate.title = value;
					}),
				)
				.addToggle((toggle) =>
					toggle.setValue(candidate.selected).onChange((on) => {
						candidate.selected = on;
					}),
				);
		}
		new Setting(this.contentEl)
			.addButton((button) =>
				button
					.setButtonText(t('titles.apply'))
					.setCta()
					.onClick(() => {
						this.close();
						this.on_apply(this.chosen());
					}),
			)
			.addButton((button) => button.setButtonText(t('modal.cancel')).onClick(() => this.close()));
	}

	onClose(): void {
		this.contentEl.empty();
	}

	/** Selected candidates with a usable title, trimmed. */
	private chosen(): TitleCandidate[] {
		return this.candidates.flatMap((candidate) => {
			const title = clean_title(candidate.title);
			return candidate.selected && title !== null ? [{ ...candidate, title }] : [];
		});
	}
}
