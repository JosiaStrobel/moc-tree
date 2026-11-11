import { type App, Modal, Setting, type TFile } from 'obsidian';
import { t } from './i18n';
import type { ListIssue } from './structure_check';

/** Issues found in one folder note. */
export interface FolderReport {
	file: TFile;
	name: string;
	issues: ListIssue[];
}

/** Lists the findings with a checkbox each; duplicates are preselected, dead links are not. */
export class StructureCheckModal extends Modal {
	private readonly selected = new Map<TFile, Set<ListIssue>>();

	constructor(
		app: App,
		private readonly reports: readonly FolderReport[],
		private readonly cycle_names: readonly string[],
		private readonly on_clean: (selection: ReadonlyMap<TFile, readonly ListIssue[]>) => void,
	) {
		super(app);
		for (const report of reports) {
			this.selected.set(report.file, new Set(report.issues.filter((issue) => issue.kind === 'duplicate')));
		}
	}

	onOpen(): void {
		this.setTitle(t('command.check_structure'));
		if (this.cycle_names.length > 0) {
			this.contentEl.createEl('p', {
				cls: 'moc-tree-check-cycles',
				text: t('check.cycles', { names: this.cycle_names.join(', ') }),
			});
		}
		for (const report of this.reports) {
			new Setting(this.contentEl).setName(report.name).setHeading();
			const chosen = this.selected.get(report.file) ?? new Set<ListIssue>();
			for (const issue of report.issues) {
				const label = t(issue.kind === 'duplicate' ? 'check.duplicate' : 'check.dead', { value: issue.value });
				new Setting(this.contentEl).setName(label).addToggle((toggle) =>
					toggle.setValue(chosen.has(issue)).onChange((on) => {
						if (on) chosen.add(issue);
						else chosen.delete(issue);
					}),
				);
			}
		}
		const buttons = new Setting(this.contentEl);
		if (this.reports.length > 0) {
			buttons.addButton((button) =>
				button
					.setButtonText(t('check.clean'))
					.setCta()
					.onClick(() => {
						this.close();
						const selection = new Map<TFile, ListIssue[]>();
						for (const [file, issues] of this.selected) if (issues.size > 0) selection.set(file, [...issues]);
						this.on_clean(selection);
					}),
			);
		}
		buttons.addButton((button) => button.setButtonText(t('modal.cancel')).onClick(() => this.close()));
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
