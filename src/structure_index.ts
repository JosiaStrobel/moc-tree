/** Structure index: tree, orphans and multiple parents derived from the MOC child lists. */

/** One link from a structure list; `path` is null if the link does not resolve. */
export interface ChildLink {
	link: string;
	path: string | null;
}

/** What the index needs to know about a note (collected from the metadata cache). */
export interface NoteInput {
	path: string;
	basename: string;
	/** Value of `title`, null if missing or empty. */
	title: string | null;
	/** Values of `aliases`. */
	aliases: string[];
	/** True if the note lies in a managed folder. */
	managed: boolean;
	/** Structure list in file order; null if the note is no MOC. */
	children: ChildLink[] | null;
	/** True if the note carries the trash tag. */
	trashed: boolean;
}

/** Lookup tables built once per metadata change. */
export interface StructureIndex {
	notes: ReadonlyMap<string, NoteInput>;
	/** Structure list per MOC, duplicates removed. */
	children: ReadonlyMap<string, readonly ChildLink[]>;
	/** Distinct parent MOCs per note path. */
	parents: ReadonlyMap<string, readonly string[]>;
	/** Top-level MOCs: managed MOCs without parent, plus one MOC per otherwise unreachable cycle. */
	roots: readonly string[];
	/** Managed normal notes not reachable from any root and not in the trash. */
	orphans: readonly string[];
	/** Top-level entries of the trash section: trashed notes not below another trashed note. */
	trash: readonly string[];
	/** Trashed notes and everything only reachable through them; hidden in the tree. */
	in_trash: ReadonlySet<string>;
}

/** How a tree row is shown. */
export type EntryKind = 'note' | 'moc' | 'dead' | 'cycle';

/** One row below a MOC in the tree. */
export interface TreeEntry {
	kind: EntryKind;
	link: string;
	path: string | null;
	name: string;
	/** True if the note lies outside the managed folders. */
	outside: boolean;
	missing_title: boolean;
	parent_count: number;
}

/** Name shown in the UI: the title, or the file name as fallback. */
export function display_name(note: NoteInput): string {
	return note.title ?? note.basename;
}

/** Remove repeated links to the same target, keeping the first position. */
function dedupe_links(links: readonly ChildLink[]): ChildLink[] {
	const seen = new Set<string>();
	return links.filter((child) => {
		const key = child.path ?? `dead:${child.link}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}

/** Sort note paths by display name, then by path for a stable order. */
function sort_by_name(paths: string[], notes: ReadonlyMap<string, NoteInput>): string[] {
	const name = (path: string) => {
		const note = notes.get(path);
		return note ? display_name(note) : path;
	};
	return paths.sort((a, b) => name(a).localeCompare(name(b)) || a.localeCompare(b));
}

/** True if the note carries the trash tag. */
export function is_trashed(index: Pick<StructureIndex, 'notes'>, path: string): boolean {
	return index.notes.get(path)?.trashed ?? false;
}

/** Mark every note reachable from `start` (including itself) as visited; `skip` notes are not entered. */
function mark_reachable(
	start: string,
	children: ReadonlyMap<string, readonly ChildLink[]>,
	visited: Set<string>,
	skip: (path: string) => boolean = () => false,
): void {
	const stack = [start];
	while (stack.length > 0) {
		const path = stack.pop() as string;
		if (visited.has(path) || skip(path)) continue;
		visited.add(path);
		for (const child of children.get(path) ?? []) {
			if (child.path !== null && !visited.has(child.path)) stack.push(child.path);
		}
	}
}

/** Build the index from all managed notes and the outside notes the structure lists point to. */
export function build_structure_index(inputs: readonly NoteInput[]): StructureIndex {
	const notes = new Map(inputs.map((note) => [note.path, note]));
	const children = new Map<string, ChildLink[]>();
	const parents = new Map<string, string[]>();

	for (const note of notes.values()) {
		if (note.children === null) continue;
		const links = dedupe_links(note.children);
		children.set(note.path, links);
		for (const child of links) {
			if (child.path === null) continue;
			const list = parents.get(child.path) ?? [];
			list.push(note.path);
			parents.set(child.path, list);
		}
	}

	const trashed = (path: string) => notes.get(path)?.trashed ?? false;
	const managed_mocs = [...children.keys()].filter((path) => notes.get(path)?.managed && !trashed(path));
	const roots = sort_by_name(
		managed_mocs.filter((path) => !parents.has(path)),
		notes,
	);
	const visited = new Set<string>();
	for (const root of roots) mark_reachable(root, children, visited, trashed);

	// Everything reachable from trashed notes but not from the visible tree belongs to the trash.
	const trashed_paths = sort_by_name([...notes.keys()].filter(trashed), notes);
	const trash_reach = new Set<string>();
	for (const path of trashed_paths) mark_reachable(path, children, trash_reach);

	// MOCs that only hang in a cycle would vanish; show one per cycle at the top level.
	for (const path of sort_by_name(managed_mocs.filter((p) => !visited.has(p) && !trash_reach.has(p)), notes)) {
		if (visited.has(path)) continue;
		roots.push(path);
		mark_reachable(path, children, visited, trashed);
	}
	const in_trash = new Set([...trash_reach].filter((path) => !visited.has(path)));

	const orphans = sort_by_name(
		[...notes.values()]
			.filter(
				(note) =>
					note.managed && note.children === null && !visited.has(note.path) && !in_trash.has(note.path),
			)
			.map((note) => note.path),
		notes,
	);

	return { notes, children, parents, roots, orphans, trash: trash_tops(trashed_paths, children), in_trash };
}

/** Trashed notes that are not below another trashed note; one per cycle of trashed folders. */
function trash_tops(trashed: readonly string[], children: ReadonlyMap<string, readonly ChildLink[]>): string[] {
	const below = new Set<string>();
	for (const path of trashed) {
		for (const child of children.get(path) ?? []) {
			if (child.path !== null) mark_reachable(child.path, children, below);
		}
	}
	const tops = trashed.filter((path) => !below.has(path));
	const covered = new Set<string>();
	for (const path of tops) mark_reachable(path, children, covered);
	for (const path of trashed) {
		if (covered.has(path)) continue;
		tops.push(path);
		mark_reachable(path, children, covered);
	}
	return tops;
}

/** Describe a single note as a tree row. */
export function describe_note(index: StructureIndex, path: string, link = path): TreeEntry {
	const note = index.notes.get(path);
	return {
		kind: note?.children ? 'moc' : 'note',
		link,
		path,
		name: note ? display_name(note) : link,
		outside: !note?.managed,
		missing_title: note !== undefined && note.title === null,
		parent_count: index.parents.get(path)?.length ?? 0,
	};
}

/**
 * Rows below a MOC. `ancestors` are the MOCs on the way from the root down to (and including)
 * `moc_path`; a child that is one of them is returned as `cycle` and must not be expanded.
 * Trashed children are left out unless `include_trashed` is set (inside the trash section).
 */
export function child_entries(
	index: StructureIndex,
	moc_path: string,
	ancestors: ReadonlySet<string>,
	include_trashed = false,
): TreeEntry[] {
	const children = index.children.get(moc_path) ?? [];
	const shown = include_trashed ? children : children.filter((child) => child.path === null || !is_trashed(index, child.path));
	return shown.map((child) => {
		if (child.path === null) {
			return {
				kind: 'dead',
				link: child.link,
				path: null,
				name: child.link,
				outside: false,
				missing_title: false,
				parent_count: 0,
			};
		}
		const entry = describe_note(index, child.path, child.link);
		return ancestors.has(child.path) ? { ...entry, kind: 'cycle' } : entry;
	});
}

/** True if `path` is `folder` itself or lies anywhere below it; used to block cyclic moves. */
export function is_within(index: StructureIndex, folder: string, path: string): boolean {
	const visited = new Set<string>();
	mark_reachable(folder, index.children, visited);
	return visited.has(path);
}
