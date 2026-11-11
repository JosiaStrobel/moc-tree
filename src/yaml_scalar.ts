/** Minimal single-line YAML scalar handling for line-based frontmatter edits. */

/** Quote style of a scalar as written in the file; `''` means plain (unquoted). */
export type QuoteStyle = '"' | "'" | '';

/** A parsed scalar with the quote style it was written in. */
export interface ParsedScalar {
	value: string;
	quote: QuoteStyle;
}

/** Characters that may not start a plain scalar (plus flow indicators). */
const SPECIAL_START = /^[-?:,[\]{}#&*!|>'"%@`]/;
/** Plain values YAML would read as something other than a string. */
const NON_STRING = /^(true|false|yes|no|on|off|y|n|null|~)$|^[-+.]?\d/i;

/** Index of the closing double quote, honoring backslash escapes; -1 if missing. */
function double_quote_end(text: string): number {
	for (let i = 1; i < text.length; i++) {
		if (text[i] === '\\') i++;
		else if (text[i] === '"') return i;
	}
	return -1;
}

/** Index of the closing single quote (`''` is an escaped quote); -1 if missing. */
function single_quote_end(text: string): number {
	for (let i = 1; i < text.length; i++) {
		if (text[i] !== "'") continue;
		if (text[i + 1] === "'") i++;
		else return i;
	}
	return -1;
}

/** True if only whitespace or a comment follows. */
function is_rest_empty(rest: string): boolean {
	const trimmed = rest.trim();
	return trimmed === '' || trimmed.startsWith('#');
}

/** Parse a single-line scalar (trailing comments allowed); null for unsupported forms. */
export function parse_scalar(raw: string): ParsedScalar | null {
	const text = raw.trim();
	if (text.startsWith('#')) return null;
	if (text.startsWith('"')) {
		const end = double_quote_end(text);
		if (end < 0 || !is_rest_empty(text.slice(end + 1))) return null;
		try {
			return { value: JSON.parse(text.slice(0, end + 1)) as string, quote: '"' };
		} catch {
			return null; // YAML-only escape sequence, leave the line alone
		}
	}
	if (text.startsWith("'")) {
		const end = single_quote_end(text);
		if (end < 0 || !is_rest_empty(text.slice(end + 1))) return null;
		return { value: text.slice(1, end).replace(/''/g, "'"), quote: "'" };
	}
	const value = text.replace(/\s#.*$/, '').trim();
	if (value === '' || /^[[\]{}&*!|>%@`]/.test(value) || /^[-?:](\s|$)/.test(value)) return null;
	if (/:(\s|$)/.test(value)) return null;
	return { value, quote: '' };
}

/** True if the value must be quoted to stay the same string. */
export function needs_quotes(value: string, in_flow: boolean): boolean {
	if (value === '' || value !== value.trim()) return true;
	if (SPECIAL_START.test(value) || NON_STRING.test(value)) return true;
	if (/:(\s|$)|\s#/.test(value)) return true;
	return in_flow && /[,[\]{}]/.test(value);
}

/** Format a value, keeping the preferred quote style when possible. */
export function format_scalar(value: string, preferred: QuoteStyle, in_flow = false): string {
	if (preferred === "'") return `'${value.replace(/'/g, "''")}'`;
	if (preferred === '' && !needs_quotes(value, in_flow)) return value;
	return JSON.stringify(value);
}

/** Split the inner part of a flow sequence `[a, "b"]` into raw items; null if nested or broken. */
export function split_flow_sequence(raw: string): string[] | null {
	const text = raw.trim();
	if (!text.startsWith('[') || !text.endsWith(']')) return null;
	const inner = text.slice(1, -1);
	const items: string[] = [];
	let start = 0;
	let quote = '';
	for (let i = 0; i < inner.length; i++) {
		const char = inner[i];
		if (quote === '"' && char === '\\') i++;
		else if (quote !== '' && char === quote) quote = '';
		else if (quote === '' && (char === '"' || char === "'")) quote = char;
		else if (quote === '' && /[[\]{}]/.test(char ?? '')) return null;
		else if (quote === '' && char === ',') {
			items.push(inner.slice(start, i).trim());
			start = i + 1;
		}
	}
	if (quote !== '') return null;
	const last = inner.slice(start).trim();
	if (last !== '' || items.length > 0) items.push(last);
	if (items.length > 0 && items[items.length - 1] === '') items.pop(); // trailing comma
	return items.includes('') ? null : items;
}
