import {
	type App,
	type Editor,
	type EditorPosition,
	EditorSuggest,
	type EditorSuggestContext,
	type EditorSuggestTriggerInfo,
	type TFile,
} from 'obsidian';
import { t } from './i18n';
import { type NoteMatch, search_notes } from './note_search';
import type { StructureStore } from './structure_store';

/** Text that opens the suggestions. */
const TRIGGER = '@@';
const MAX_SUGGESTIONS = 30;

/** `@@` suggestions: find managed notes by title or alias, insert `[[file]]` without display text. */
export class LinkSuggest extends EditorSuggest<NoteMatch> {
	constructor(
		app: App,
		private readonly store: StructureStore,
	) {
		super(app);
		this.limit = MAX_SUGGESTIONS;
		this.setInstructions([
			{ command: '↑↓', purpose: t('suggest.navigate') },
			{ command: '↵', purpose: t('suggest.insert') },
		]);
	}

	onTrigger(cursor: EditorPosition, editor: Editor): EditorSuggestTriggerInfo | null {
		const before = editor.getLine(cursor.line).slice(0, cursor.ch);
		const start = before.lastIndexOf(TRIGGER);
		if (start < 0) return null;
		const query = before.slice(start + TRIGGER.length);
		if (/[@[\]]/.test(query)) return null;
		return { start: { line: cursor.line, ch: start }, end: cursor, query };
	}

	getSuggestions(context: EditorSuggestContext): NoteMatch[] {
		return search_notes(this.store.get_index().notes.values(), context.query, MAX_SUGGESTIONS);
	}

	renderSuggestion(match: NoteMatch, el: HTMLElement): void {
		el.addClass('mod-complex');
		const content = el.createDiv({ cls: 'suggestion-content' });
		content.createDiv({ cls: 'suggestion-title', text: match.name });
		if (match.alias !== null) content.createDiv({ cls: 'suggestion-note', text: match.alias });
	}

	selectSuggestion(match: NoteMatch): void {
		const context = this.context;
		const target = this.app.vault.getFileByPath(match.path);
		if (!context || !target) return;
		const link = `[[${this.link_text(target, context.file)}]]`;
		context.editor.replaceRange(link, context.start, context.end);
		context.editor.setCursor({ line: context.start.line, ch: context.start.ch + link.length });
	}

	/** Shortest unambiguous link text from the current note. */
	private link_text(target: TFile, source: TFile | null): string {
		return this.app.metadataCache.fileToLinktext(target, source?.path ?? '', true);
	}
}
