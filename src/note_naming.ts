import { format_scalar } from './yaml_scalar';

/** File names and initial content for new managed notes. */

const SUFFIX_LENGTH = 2;
const SUFFIX_CHARS = '0123456789';

/** Two-digit zero padding. */
function pad(value: number): string {
	return String(value).padStart(2, '0');
}

/** Timestamp ID with seconds and a random suffix, e.g. `2026111009123048`. */
export function timestamp_id(date: Date, random: () => number = Math.random): string {
	const stamp =
		`${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
		`${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
	let suffix = '';
	for (let i = 0; i < SUFFIX_LENGTH; i++) {
		suffix += SUFFIX_CHARS[Math.floor(random() * SUFFIX_CHARS.length)] ?? '0';
	}
	return `${stamp}${suffix}`;
}

/** Remove characters that are invalid in file names or break wiki links; collapse whitespace. */
export function sanitize_file_name(name: string): string {
	return name
		.replace(/[\\/:*?"<>|#^[\]]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.replace(/^\.+/, '');
}

/** First free name: `base`, then `base 2`, `base 3`, … */
export function unique_name(base: string, is_taken: (name: string) => boolean): string {
	if (!is_taken(base)) return base;
	let counter = 2;
	while (is_taken(`${base} ${counter}`)) counter++;
	return `${base} ${counter}`;
}

/** Normalized title, or null if it is empty or spans several lines. */
export function clean_title(title: string): string | null {
	const cleaned = title.trim();
	return cleaned === '' || /[\r\n]/.test(cleaned) ? null : cleaned;
}

/** Split comma-separated synonyms; drops empty entries, duplicates and the title itself. */
export function parse_synonyms(input: string, title: string): string[] {
	const result: string[] = [];
	for (const part of input.split(',')) {
		const synonym = clean_title(part);
		if (synonym !== null && synonym !== title && !result.includes(synonym)) result.push(synonym);
	}
	return result;
}

/** Frontmatter for a new note; synonyms follow the title in `aliases`, folder notes get an empty structure list. */
export function build_note_content(title: string, structure_key: string | null, synonyms: string[] = []): string {
	const value = format_scalar(title, '');
	const lines = ['---', `title: ${value}`, 'aliases:', `  - ${value}`];
	for (const synonym of synonyms) lines.push(`  - ${format_scalar(synonym, '')}`);
	if (structure_key !== null) lines.push(`${structure_key}: []`);
	lines.push('---', '');
	return lines.join('\n');
}
