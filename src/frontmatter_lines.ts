import {
	format_scalar,
	type ParsedScalar,
	parse_scalar,
	type QuoteStyle,
	split_flow_sequence,
} from './yaml_scalar';

/**
 * Line-based frontmatter edits that touch only the affected lines.
 * Every function returns the new text, the same text if nothing changes,
 * or null if the frontmatter has a form it cannot edit safely.
 */

const DEFAULT_INDENT = '  ';

/** Text split into lines plus the frontmatter range (indices of the `---` lines). */
interface Doc {
	lines: string[];
	eol: string;
	fm: { start: number; end: number } | null;
}

/** A top-level key: its line, the first line after its block and the text after the colon. */
interface KeyBlock {
	line: number;
	end: number;
	prefix: string;
	value: string;
}

interface BlockItem {
	line: number;
	scalar: ParsedScalar;
}

type ListView =
	| { kind: 'block'; indent: string; quote: QuoteStyle; items: BlockItem[] }
	| { kind: 'flow'; quote: QuoteStyle; raw: string[]; items: ParsedScalar[] };

/** Split text into lines; null if a frontmatter block is opened but never closed. */
function load(text: string): Doc | null {
	const eol = text.includes('\r\n') ? '\r\n' : '\n';
	const lines = text.split(/\r?\n/);
	if (!/^---\s*$/.test(lines[0] ?? '')) return { lines, eol, fm: null };
	const end = lines.findIndex((line, i) => i > 0 && /^(---|\.\.\.)\s*$/.test(line));
	return end < 0 ? null : { lines, eol, fm: { start: 0, end } };
}

/** Find a top-level key; undefined if missing, null if it occurs more than once. */
function find_key(doc: Doc, key: string): KeyBlock | undefined | null {
	const fm = doc.fm;
	if (!fm) return undefined;
	let found: KeyBlock | undefined;
	for (let i = fm.start + 1; i < fm.end; i++) {
		const match = /^(?:"([^"]*)"|'([^']*)'|([^\s:#-][^:]*?))\s*:(?:\s+(.*))?$/.exec(doc.lines[i] ?? '');
		if (!match || (match[1] ?? match[2] ?? match[3]) !== key) continue;
		if (found) return null;
		let end = i + 1;
		while (end < fm.end && /^(\s|-|$)/.test(doc.lines[end] ?? '')) end++;
		while (end > i + 1 && (doc.lines[end - 1] ?? '').trim() === '') end--;
		const line = doc.lines[i] ?? '';
		const value = match[4] ?? '';
		found = { line: i, end, prefix: line.slice(0, line.length - value.length).trimEnd(), value };
	}
	return found;
}

/** Quote style of a list: the first one used; plain (quoted only when needed) if none is. */
function list_quote(items: readonly ParsedScalar[]): QuoteStyle {
	return items.find((item) => item.quote !== '')?.quote ?? '';
}

/** Read the list under a key; null if it is not a plain single-line-scalar list. */
function read_list(doc: Doc, block: KeyBlock): ListView | null {
	const value = block.value.trim();
	if (value === '' || value.startsWith('#')) {
		const items: BlockItem[] = [];
		let indent: string | undefined;
		for (let i = block.line + 1; i < block.end; i++) {
			const line = doc.lines[i] ?? '';
			if (line.trim() === '') continue;
			const match = /^(\s*)-\s+(.*)$/.exec(line);
			if (!match || (indent !== undefined && match[1] !== indent)) return null;
			indent = match[1] ?? '';
			const scalar = parse_scalar(match[2] ?? '');
			if (!scalar) return null;
			items.push({ line: i, scalar });
		}
		const quote = list_quote(items.map((item) => item.scalar));
		return { kind: 'block', indent: indent ?? DEFAULT_INDENT, quote, items };
	}
	if (block.end !== block.line + 1) return null;
	const raw = split_flow_sequence(value);
	if (!raw) return null;
	const items = raw.map(parse_scalar);
	if (items.some((item) => item === null)) return null;
	const parsed = items as ParsedScalar[];
	return { kind: 'flow', quote: list_quote(parsed), raw, items: parsed };
}

/** Join lines back into text. */
function save(doc: Doc): string {
	return doc.lines.join(doc.eol);
}

/** Add lines as new top-level entries, creating the frontmatter if needed. */
function append_entry(doc: Doc, entry: string[]): string {
	if (doc.fm) {
		doc.lines.splice(doc.fm.end, 0, ...entry);
		return save(doc);
	}
	const body = save(doc);
	return ['---', ...entry, '---', ''].join(doc.eol) + body;
}

/** Values of a list. */
function list_values(list: ListView): string[] {
	return list.kind === 'block' ? list.items.map((item) => item.scalar.value) : list.items.map((item) => item.value);
}

/** Insert a list item at a position (default: end); creates the key or frontmatter if missing. */
export function insert_list_item(text: string, key: string, item: string, index?: number): string | null {
	const doc = load(text);
	if (!doc) return null;
	const block = find_key(doc, key);
	if (block === null) return null;
	if (!block) return append_entry(doc, [`${key}:`, `${DEFAULT_INDENT}- ${format_scalar(item, '')}`]);
	const list = read_list(doc, block);
	if (!list) return null;
	const values = list_values(list);
	if (values.includes(item)) return text;
	const position = Math.max(0, Math.min(index ?? values.length, values.length));
	if (list.kind === 'block') {
		const target = list.items[position]?.line ?? (list.items[list.items.length - 1]?.line ?? block.line) + 1;
		doc.lines.splice(target, 0, `${list.indent}- ${format_scalar(item, list.quote)}`);
	} else if (list.raw.length === 0) {
		doc.lines.splice(block.line, 1, block.prefix, `${DEFAULT_INDENT}- ${format_scalar(item, '')}`);
	} else {
		list.raw.splice(position, 0, format_scalar(item, list.quote, true));
		doc.lines[block.line] = `${block.prefix} [${list.raw.join(', ')}]`;
	}
	return save(doc);
}

/** Remove every occurrence of a list item; an emptied list becomes `key: []`. */
export function remove_list_item(text: string, key: string, item: string): string | null {
	const doc = load(text);
	if (!doc) return null;
	const block = find_key(doc, key);
	if (block === null) return null;
	if (!block) return text;
	const list = read_list(doc, block);
	if (!list) return null;
	if (!list_values(list).includes(item)) return text;
	if (list.kind === 'block') {
		const remaining = list.items.filter((entry) => entry.scalar.value !== item);
		if (remaining.length === 0) {
			doc.lines.splice(block.line, block.end - block.line, `${block.prefix} []`);
		} else {
			for (const entry of [...list.items].reverse()) {
				if (entry.scalar.value === item) doc.lines.splice(entry.line, 1);
			}
		}
	} else {
		const raw = list.raw.filter((_, i) => list.items[i]?.value !== item);
		doc.lines[block.line] = `${block.prefix} [${raw.join(', ')}]`;
	}
	return save(doc);
}

/** Replace one list item in place, keeping its quote style; removes `old` if `next` already exists. */
export function replace_list_item(text: string, key: string, old: string, next: string): string | null {
	const doc = load(text);
	if (!doc) return null;
	const block = find_key(doc, key);
	if (block === null) return null;
	if (!block) return text;
	const list = read_list(doc, block);
	if (!list) return null;
	const values = list_values(list);
	if (!values.includes(old) || old === next) return text;
	if (values.includes(next)) return remove_list_item(text, key, old);
	if (list.kind === 'block') {
		for (const entry of list.items) {
			if (entry.scalar.value !== old) continue;
			doc.lines[entry.line] = `${list.indent}- ${format_scalar(next, entry.scalar.quote)}`;
		}
	} else {
		list.items.forEach((entry, i) => {
			if (entry.value === old) list.raw[i] = format_scalar(next, entry.quote, true);
		});
		doc.lines[block.line] = `${block.prefix} [${list.raw.join(', ')}]`;
	}
	return save(doc);
}

/** Set a single-line scalar value, keeping its quote style; creates the key or frontmatter if missing. */
export function set_scalar(text: string, key: string, value: string): string | null {
	const doc = load(text);
	if (!doc) return null;
	const block = find_key(doc, key);
	if (block === null) return null;
	if (!block) return append_entry(doc, [`${key}: ${format_scalar(value, '')}`]);
	if (block.end !== block.line + 1) return null;
	const current = block.value.trim() === '' ? { value: '', quote: '' as const } : parse_scalar(block.value);
	if (!current) return null;
	if (current.value === value) return text;
	doc.lines[block.line] = `${block.prefix} ${format_scalar(value, current.quote)}`;
	return save(doc);
}

/** Add `key: []` unless the key already exists (with any value). */
export function add_empty_list(text: string, key: string): string | null {
	const doc = load(text);
	if (!doc) return null;
	const block = find_key(doc, key);
	if (block === null) return null;
	return block ? text : append_entry(doc, [`${key}: []`]);
}

/** Remove a top-level key with its whole block; other lines stay untouched. */
export function remove_key(text: string, key: string): string | null {
	const doc = load(text);
	if (!doc) return null;
	const block = find_key(doc, key);
	if (block === null) return null;
	if (!block) return text;
	doc.lines.splice(block.line, block.end - block.line);
	return save(doc);
}

/** Values of a list property; [] if the key is missing, null if it cannot be read safely. */
export function read_list_items(text: string, key: string): string[] | null {
	const doc = load(text);
	if (!doc) return null;
	const block = find_key(doc, key);
	if (block === null) return null;
	if (!block) return [];
	const list = read_list(doc, block);
	return list ? list_values(list) : null;
}

/** Remove list items by position (0-based); an emptied list becomes `key: []`. */
export function remove_list_indices(text: string, key: string, indices: readonly number[]): string | null {
	const doc = load(text);
	if (!doc) return null;
	const block = find_key(doc, key);
	if (block === null) return null;
	if (!block) return text;
	const list = read_list(doc, block);
	if (!list) return null;
	const count = list.items.length;
	const remove = new Set(indices.filter((i) => i >= 0 && i < count));
	if (remove.size === 0) return text;
	if (list.kind === 'block' && remove.size === count) {
		doc.lines.splice(block.line, block.end - block.line, `${block.prefix} []`);
	} else if (list.kind === 'block') {
		for (const i of [...remove].sort((a, b) => b - a)) {
			const line = list.items[i]?.line;
			if (line !== undefined) doc.lines.splice(line, 1);
		}
	} else {
		const raw = list.raw.filter((_, i) => !remove.has(i));
		doc.lines[block.line] = `${block.prefix} [${raw.join(', ')}]`;
	}
	return save(doc);
}
