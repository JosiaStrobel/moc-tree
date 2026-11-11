import de from './de';
import en, { type MessageKey, type Messages } from './en';

export type { MessageKey } from './en';

/** Available UI languages; English is the fallback. */
export const LANGUAGES: Readonly<Record<string, Messages>> = { en, de };

let current: Messages = en;

/** Select the UI language from an Obsidian language code (e.g. "de", "pt-BR"). */
export function set_language(code: string): void {
	current = LANGUAGES[code] ?? LANGUAGES[code.split('-')[0] ?? ''] ?? en;
}

/**
 * Get the UI text for a key with {placeholders} filled in; unknown placeholders stay.
 * Falls back to English, then to the key, so a missing text never breaks loading.
 */
export function t(key: MessageKey, params: Record<string, string | number> = {}): string {
	const selected: Partial<Messages> = current;
	const fallback: Partial<Messages> = en;
	const text = selected[key] ?? fallback[key] ?? key;
	return text.replace(/\{(\w+)\}/g, (match, name: string) =>
		name in params ? String(params[name]) : match,
	);
}
