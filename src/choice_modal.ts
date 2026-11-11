import { type App, Modal, Setting } from 'obsidian';
import { t } from './i18n';

/** One answer button of a choice dialog. */
export interface Choice {
	label: string;
	cta?: boolean;
	destructive?: boolean;
	action: () => void;
}

/** Dialog with a message, answer buttons and "Cancel". */
export class ChoiceModal extends Modal {
	constructor(
		app: App,
		private readonly heading: string,
		private readonly message: string,
		private readonly choices: readonly Choice[],
	) {
		super(app);
	}

	onOpen(): void {
		this.setTitle(this.heading);
		this.contentEl.createEl('p', { text: this.message });
		const buttons = new Setting(this.contentEl);
		for (const choice of this.choices) {
			buttons.addButton((button) => {
				button.setButtonText(choice.label).onClick(() => {
					this.close();
					choice.action();
				});
				if (choice.cta) button.setCta();
				if (choice.destructive) button.setDestructive();
			});
		}
		buttons.addButton((button) => button.setButtonText(t('modal.cancel')).onClick(() => this.close()));
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
