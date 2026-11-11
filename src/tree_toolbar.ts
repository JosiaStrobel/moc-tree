import { setIcon } from 'obsidian';

/** One toolbar button. */
export interface ToolbarButton {
	icon: string;
	label: string;
	action: () => void;
}

/** Button row in the style of the file explorer (view header actions are hidden in sidebars). */
export function render_toolbar(parent_el: HTMLElement, buttons: readonly ToolbarButton[]): void {
	const bar = parent_el.createDiv({ cls: 'nav-buttons-container moc-tree-toolbar' });
	for (const button of buttons) {
		const el = bar.createDiv({ cls: 'clickable-icon nav-action-button', attr: { 'aria-label': button.label } });
		setIcon(el, button.icon);
		el.addEventListener('click', button.action);
	}
}
