import type { App } from 'obsidian';
import { STRUCTURE_VIEW_TYPE, StructureView } from './structure_view';

/** Show the structure sidebar; reuse an open one, otherwise open it in the left sidebar. */
export async function open_structure_view(app: App): Promise<StructureView | null> {
	let leaf = app.workspace.getLeavesOfType(STRUCTURE_VIEW_TYPE)[0] ?? null;
	if (!leaf) {
		leaf = app.workspace.getLeftLeaf(false);
		if (!leaf) return null;
		await leaf.setViewState({ type: STRUCTURE_VIEW_TYPE, active: true });
	}
	await app.workspace.revealLeaf(leaf);
	return leaf.view instanceof StructureView ? leaf.view : null;
}

/** Open the sidebar and show a note in the tree. */
export async function reveal_in_structure(app: App, path: string): Promise<void> {
	const view = await open_structure_view(app);
	view?.reveal(path);
}
