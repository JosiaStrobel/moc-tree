/** Tree positions below a folder, for expanding or collapsing a whole subtree (no Obsidian dependency). */
import { position_key } from './expand_state';
import { child_entries, type StructureIndex } from './structure_index';

/** Upper bound of positions, so heavily cross-filed structures cannot explode. */
export const MAX_SUBTREE_KEYS = 2000;

/** Position keys of a folder and all folders below it; cycles are not followed. */
export function subtree_keys(
	index: StructureIndex,
	ancestors: readonly string[],
	path: string,
	limit = MAX_SUBTREE_KEYS,
): string[] {
	const keys: string[] = [];
	const visit = (chain_before: readonly string[], folder: string) => {
		if (keys.length >= limit) return;
		keys.push(position_key(chain_before, folder));
		const chain = [...chain_before, folder];
		for (const child of child_entries(index, folder, new Set(chain))) {
			if (child.kind === 'moc' && child.path !== null) visit(chain, child.path);
		}
	};
	visit(ancestors, path);
	return keys;
}
