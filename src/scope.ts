/** Which files the plugin manages: everything inside the managed folders. */

/** Normalize a folder path: forward slashes, no empty segments, no leading/trailing slash. */
export function clean_folder_path(path: string): string {
	return path
		.trim()
		.replace(/\\/g, '/')
		.split('/')
		.filter((segment) => segment !== '' && segment !== '.')
		.join('/');
}

/** All managed folders: the new-note folder first, then the watched ones, without duplicates. */
export function managed_folders(new_note_folder: string, watched_folders: readonly string[]): string[] {
	return [...new Set([new_note_folder, ...watched_folders].map(clean_folder_path))];
}

/** True if the file path lies in one of the folders (recursive); `''` stands for the whole vault. */
export function is_in_folders(file_path: string, folders: readonly string[]): boolean {
	return folders.some((folder) => folder === '' || file_path.startsWith(`${folder}/`));
}
