/** Find duplicates, dead links and cycles in structure lists (no Obsidian dependency). */
import type { StructureIndex } from './structure_index';

/** One problematic list entry, identified by position and value. */
export interface ListIssue {
	index: number;
	value: string;
	kind: 'duplicate' | 'dead';
}

/**
 * Issues in one structure list. A value is a duplicate if an earlier value points to the
 * same note (or is the same dead link); otherwise it is dead if it resolves to nothing.
 */
export function find_list_issues(values: readonly string[], resolve: (value: string) => string | null): ListIssue[] {
	const seen = new Set<string>();
	const issues: ListIssue[] = [];
	values.forEach((value, index) => {
		const target = resolve(value);
		const key = target ?? `dead:${value}`;
		if (seen.has(key)) {
			issues.push({ index, value, kind: 'duplicate' });
		} else {
			seen.add(key);
			if (target === null) issues.push({ index, value, kind: 'dead' });
		}
	});
	return issues;
}

/** Folders that contain themselves through their children, sorted by path. */
export function cycle_members(index: StructureIndex): string[] {
	const members: string[] = [];
	for (const [folder, children] of index.children) {
		const stack = children.flatMap((child) => (child.path === null ? [] : [child.path]));
		const visited = new Set<string>();
		while (stack.length > 0) {
			const path = stack.pop() as string;
			if (path === folder) {
				members.push(folder);
				break;
			}
			if (visited.has(path)) continue;
			visited.add(path);
			for (const child of index.children.get(path) ?? []) {
				if (child.path !== null) stack.push(child.path);
			}
		}
	}
	return members.sort();
}
