import { type Extension, type Range, StateEffect } from '@codemirror/state';
import {
	Decoration,
	type DecorationSet,
	type EditorView,
	ViewPlugin,
	type ViewUpdate,
	WidgetType,
} from '@codemirror/view';
import { type App, editorInfoField, editorLivePreviewField, Keymap } from 'obsidian';
import { plain_link_target } from './plain_link';
import type { StructureStore } from './structure_store';
import { linked_title } from './title_links';

/** Forces a redraw after the structure index changed (e.g. a title was edited elsewhere). */
const refresh_effect = StateEffect.define<null>();

/** The title shown in place of the link target; clicking opens the note. */
class TitleWidget extends WidgetType {
	constructor(
		private readonly app: App,
		private readonly title: string,
		private readonly link: string,
		private readonly source_path: string,
	) {
		super();
	}

	eq(other: TitleWidget): boolean {
		return other.title === this.title && other.link === this.link && other.source_path === this.source_path;
	}

	toDOM(): HTMLElement {
		const el = createSpan({ cls: 'moc-tree-title-link', text: this.title });
		el.addEventListener('mousedown', (event) => event.preventDefault());
		el.addEventListener('click', (event) => {
			event.preventDefault();
			void this.app.workspace.openLinkText(this.link, this.source_path, Keymap.isModEvent(event));
		});
		return el;
	}

	ignoreEvent(): boolean {
		return true;
	}
}

/** True if any selection range touches [from, to]; the raw link is shown while editing it. */
function touches_selection(view: EditorView, from: number, to: number): boolean {
	return view.state.selection.ranges.some((range) => range.from <= to && range.to >= from);
}

/** Decorations replacing the target of plain links with the linked note's title. */
function build_decorations(app: App, store: StructureStore, view: EditorView): DecorationSet {
	if (!view.state.field(editorLivePreviewField, false)) return Decoration.none;
	const file = view.state.field(editorInfoField, false)?.file;
	if (!file) return Decoration.none;
	const doc = view.state.doc;
	const ranges: Range<Decoration>[] = [];
	// Link positions come from the metadata cache, which skips code; stale ones are dropped below.
	for (const link of app.metadataCache.getFileCache(file)?.links ?? []) {
		const target = plain_link_target(link.original);
		const from = link.position.start.offset;
		const to = link.position.end.offset;
		if (target === null || to > doc.length || doc.sliceString(from, to) !== link.original) continue;
		if (touches_selection(view, from, to)) continue;
		const title = linked_title(app, store, target, file.path);
		if (title === null) continue;
		ranges.push(Decoration.replace({ widget: new TitleWidget(app, title, target, file.path) }).range(from + 2, to - 2));
	}
	return Decoration.set(ranges, true);
}

/** Live Preview extension showing titles for links without display text. */
export function title_link_extension(app: App, store: StructureStore): Extension {
	return ViewPlugin.fromClass(
		class {
			decorations: DecorationSet;
			private readonly unsubscribe: () => void;

			constructor(view: EditorView) {
				this.decorations = build_decorations(app, store, view);
				this.unsubscribe = store.on_change(() => view.dispatch({ effects: refresh_effect.of(null) }));
			}

			update(update: ViewUpdate): void {
				const mode_changed =
					update.startState.field(editorLivePreviewField, false) !==
					update.state.field(editorLivePreviewField, false);
				const refreshed = update.transactions.some((tr) => tr.effects.some((effect) => effect.is(refresh_effect)));
				if (update.docChanged || update.selectionSet || mode_changed || refreshed) {
					this.decorations = build_decorations(app, store, update.view);
				}
			}

			destroy(): void {
				this.unsubscribe();
			}
		},
		{ decorations: (plugin) => plugin.decorations },
	);
}
