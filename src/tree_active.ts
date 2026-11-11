/** Mark the active note in the rendered tree and highlight the way to it. */

const ACTIVE = 'is-active';
const ON_PATH = 'is-active-path';

/**
 * Mark rows of the active note and every folder row and child list above them,
 * so the guide lines and folder icons on the way to the note stand out.
 */
export function mark_active_rows(tree_el: HTMLElement, active_path: string | undefined): void {
	for (const el of Array.from(tree_el.querySelectorAll<HTMLElement>(`.${ACTIVE}, .${ON_PATH}`))) {
		el.removeClasses([ACTIVE, ON_PATH]);
	}
	if (active_path === undefined) return;
	for (const row of Array.from(tree_el.querySelectorAll<HTMLElement>('.moc-tree-row'))) {
		if (row.dataset.path !== active_path) continue;
		row.addClass(ACTIVE);
		let children = row.closest('.tree-item')?.parentElement?.closest<HTMLElement>('.tree-item-children');
		while (children && tree_el.contains(children)) {
			children.addClass(ON_PATH);
			const folder_row = children.parentElement?.querySelector<HTMLElement>(':scope > .moc-tree-row');
			folder_row?.addClass(ON_PATH);
			children = children.parentElement?.parentElement?.closest<HTMLElement>('.tree-item-children');
		}
	}
}

/** How long a revealed row stays highlighted, in ms. */
const FLASH_MS = 1500;

/** Row of a tree position; `section` (CSS class) picks a section such as the orphans instead of the tree. */
export function find_row(tree_el: HTMLElement, key: string, section: string | null = null): HTMLElement | null {
	const in_place = (row: HTMLElement) => {
		const block = row.closest('.moc-tree-section-block');
		return section === null ? block === null : block?.hasClass(section) === true;
	};
	const rows = Array.from(tree_el.querySelectorAll<HTMLElement>('.moc-tree-row'));
	return rows.find((row) => row.dataset.key === key && in_place(row)) ?? null;
}

/** Scroll a row into view and highlight it briefly. */
export function flash_row(row: HTMLElement | null): void {
	if (!row) return;
	row.scrollIntoView({ block: 'center' });
	row.addClass('is-flashing');
	window.setTimeout(() => row.removeClass('is-flashing'), FLASH_MS);
}
