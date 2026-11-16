/** Read-only tree of real vault folders for the "Folders" section (no Obsidian dependency). */
import { fold } from './note_search';

/** A Markdown file inside a shown folder, with its display name. */
export interface FolderFile {
	path: string;
	/** Title, or the file name as fallback. */
	name: string;
}

/** A note row of the folder tree. */
export interface FileNode {
	kind: 'file';
	path: string;
	name: string;
}

/** A real folder with its subfolders first, then its notes. */
export interface FolderNode {
	kind: 'folder';
	path: string;
	name: string;
	children: (FolderNode | FileNode)[];
	/** Number of notes in this folder and all subfolders. */
	file_count: number;
}

/** Compare names like a file explorer: case-insensitive, numbers in natural order. */
function compare_names(a: string, b: string): number {
	return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

/** Last path segment. */
function base_name(path: string): string {
	return path.slice(path.lastIndexOf('/') + 1);
}

/** Sort children recursively and count the notes. */
function finish(node: FolderNode): number {
	node.children.sort((a, b) => {
		if (a.kind !== b.kind) return a.kind === 'folder' ? -1 : 1;
		return compare_names(a.name, b.name) || a.path.localeCompare(b.path);
	});
	node.file_count = node.children.reduce((sum, child) => sum + (child.kind === 'folder' ? finish(child) : 1), 0);
	return node.file_count;
}

/** Build the tree below `root` from the files inside it; folders without notes do not appear. */
export function build_folder_tree(root: string, files: readonly FolderFile[]): FolderNode {
	const tree: FolderNode = { kind: 'folder', path: root, name: base_name(root), children: [], file_count: 0 };
	const folders = new Map<string, FolderNode>([[root, tree]]);
	const folder_at = (path: string): FolderNode => {
		const existing = folders.get(path);
		if (existing) return existing;
		const parent = folder_at(path.slice(0, path.lastIndexOf('/')));
		const node: FolderNode = { kind: 'folder', path, name: base_name(path), children: [], file_count: 0 };
		parent.children.push(node);
		folders.set(path, node);
		return node;
	};
	for (const file of files) {
		if (!file.path.startsWith(`${root}/`)) continue;
		folder_at(file.path.slice(0, file.path.lastIndexOf('/'))).children.push({ kind: 'file', ...file });
	}
	finish(tree);
	return tree;
}

/** Copy of the tree with only notes whose name contains the query (accent-tolerant); null if none match. */
export function filter_folder_tree(node: FolderNode, query: string): FolderNode | null {
	const folded = fold(query.trim());
	const visit = (folder: FolderNode): FolderNode | null => {
		const children: (FolderNode | FileNode)[] = [];
		for (const child of folder.children) {
			if (child.kind === 'folder') {
				const kept = visit(child);
				if (kept) children.push(kept);
			} else if (fold(child.name).includes(folded)) {
				children.push(child);
			}
		}
		if (children.length === 0) return null;
		const copy: FolderNode = { ...folder, children, file_count: 0 };
		finish(copy);
		return copy;
	};
	return visit(node);
}

/** Paths of all folders in the tree, the root included. */
export function folder_paths(node: FolderNode): string[] {
	return [node.path, ...node.children.flatMap((child) => (child.kind === 'folder' ? folder_paths(child) : []))];
}

/** Folders from the shown root down to the file's folder; null if the file lies in no root. */
export function folder_chain(roots: readonly string[], file_path: string): string[] | null {
	const root = roots.find((folder) => file_path.startsWith(`${folder}/`));
	if (root === undefined) return null;
	const chain = [root];
	const rest = file_path.slice(root.length + 1).split('/').slice(0, -1);
	for (const segment of rest) chain.push(`${chain[chain.length - 1]}/${segment}`);
	return chain;
}
