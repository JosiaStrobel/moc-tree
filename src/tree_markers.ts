import { Notice, setIcon, setTooltip } from 'obsidian';
import { t } from './i18n';
import { display_name, type StructureIndex, type TreeEntry } from './structure_index';

/** One marker next to a row: icon, optional text and an explanation. */
interface Marker {
	icon: string;
	text?: string;
	info: string;
}

/** Names of the other folders a note is filed in (all of them for top-level rows). */
function other_folder_names(index: StructureIndex, path: string, parent: string | null): string {
	return (index.parents.get(path) ?? [])
		.filter((folder) => folder !== parent)
		.map((folder) => {
			const note = index.notes.get(folder);
			return note ? display_name(note) : folder;
		})
		.join(', ');
}

/** Markers that apply to a row. */
function markers_for(index: StructureIndex, entry: TreeEntry, parent: string | null): Marker[] {
	const markers: Marker[] = [];
	if (entry.kind === 'dead') markers.push({ icon: 'link-2-off', info: t('view.marker.dead') });
	if (entry.kind === 'cycle') markers.push({ icon: 'repeat', info: t('view.marker.cycle') });
	if (entry.kind !== 'dead' && entry.outside) markers.push({ icon: 'log-out', info: t('view.marker.outside') });
	if (entry.missing_title) markers.push({ icon: 'alert-triangle', info: t('view.marker.no_title') });
	if (entry.path !== null && entry.parent_count > 1) {
		markers.push({
			icon: 'layers',
			text: String(entry.parent_count),
			info: t('view.marker.multi', {
				count: entry.parent_count,
				names: other_folder_names(index, entry.path, parent),
			}),
		});
	}
	return markers;
}

/** Append the markers to a row; tooltip on hover, notice on tap or click. */
export function render_markers(
	row_el: HTMLElement,
	index: StructureIndex,
	entry: TreeEntry,
	parent: string | null,
): void {
	const markers = markers_for(index, entry, parent);
	if (markers.length === 0) return;
	const outer = row_el.createDiv({ cls: 'tree-item-flair-outer moc-tree-markers' });
	for (const marker of markers) {
		const el = outer.createSpan({ cls: 'moc-tree-marker' });
		setIcon(el.createSpan({ cls: 'moc-tree-marker-icon' }), marker.icon);
		if (marker.text) el.createSpan({ text: marker.text });
		setTooltip(el, marker.info);
		el.addEventListener('click', (event) => {
			event.stopPropagation();
			new Notice(marker.info);
		});
	}
}
