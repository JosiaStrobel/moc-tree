import { describe, expect, it } from 'vitest';
import {
	NOTES_EXPORT_NAME,
	render_structure_export,
	STRUCTURE_EXPORT_NAME,
	type ExportContext,
} from './structure_export';
import { build_structure_index, type NoteInput } from './structure_index';

const CTX: ExportContext = { folders: ['Zettel', ''], inbox: 'Z', structure_key: 'children', trash_tag: 'papierkorb' };

/** Content of the structure file. */
function structure(...args: Parameters<typeof render_structure_export>): string {
	return render_structure_export(...args).get(STRUCTURE_EXPORT_NAME) ?? '';
}

/** Content of the notes table file. */
function notes(...args: Parameters<typeof render_structure_export>): string {
	return render_structure_export(...args).get(NOTES_EXPORT_NAME) ?? '';
}

/** Build a note input; `kids` lists child paths (`!name` = dead link). */
function note(path: string, title: string | null, kids?: string[], extra: Partial<NoteInput> = {}): NoteInput {
	const basename = path.replace(/^.*\//, '').replace(/\.md$/, '');
	const children =
		kids?.map((kid) => (kid.startsWith('!') ? { link: kid.slice(1), path: null } : { link: kid, path: kid })) ??
		null;
	return { path, basename, title, aliases: [], managed: true, children, trashed: false, has_body: false, ...extra };
}

/** Lines of one section, without heading and help text. */
function section(text: string, heading: string): string[] {
	const start = text.indexOf(`## ${heading}\n`);
	const end = text.indexOf('\n## ', start + 1);
	return text
		.slice(start, end === -1 ? undefined : end)
		.split('\n')
		.filter((line) => line.startsWith('- ') || line.startsWith('  '));
}

describe('render_structure_export', () => {
	it('explains the format with the current settings', () => {
		const text = structure(build_structure_index([]), CTX);
		expect(text).toContain('`Zettel`, (whole vault)');
		expect(text).toContain('`#papierkorb`');
		expect(text).toContain('property `children` is a folder note');
		expect(text).toContain('`Z/2026111009123048.md`');
		expect(notes(build_structure_index([]), CTX)).toContain('folder for new notes (`Z`)');
	});

	it('renders only folders in the tree, with markers and note counts', () => {
		const index = build_structure_index([
			note('Z/1.md', 'Physik', ['Z/2.md', '!gone', 'Z/3.md']),
			note('Z/2.md', 'Optik', ['Z/3.md', 'Z/1.md']),
			note('Z/3.md', null),
			note('Z/4.md', 'Waise'),
		]);
		const text = structure(index, CTX);
		// Pure cycle without a real root: one member stands in at the top level.
		expect(section(text, 'Tree')).toEqual([
			'- **Optik** — `2` (1 note)',
			'  - **Physik** — `1` (1 note)',
			'    - Optik — `2` [contains itself, not expanded]',
			'    - gone — `[[gone]]` [not found]',
		]);
		expect(section(text, 'Orphans')).toEqual(['- Waise — `4`']);
	});

	it('expands a folder in several places only once', () => {
		const index = build_structure_index([
			note('a.md', 'A', ['s.md']),
			note('b.md', 'B', ['s.md']),
			note('s.md', 'Shared', ['n.md']),
			note('n.md', 'N'),
		]);
		expect(section(structure(index, CTX), 'Tree')).toEqual([
			'- **A** — `a.md`',
			'  - **Shared** — `s.md` [in 2 folders] (1 note)',
			'- **B** — `b.md`',
			'  - **Shared** — `s.md` [in 2 folders] (entries listed above)',
		]);
	});

	it('lists trashed notes only in the trash section', () => {
		const index = build_structure_index([
			note('p.md', 'P', ['t.md']),
			note('t.md', 'Old', ['k.md'], { trashed: true }),
			note('k.md', 'Kid'),
		]);
		const text = structure(index, CTX);
		expect(section(text, 'Tree')).toEqual(['- **P** — `p.md`']);
		expect(section(text, 'Trash')).toEqual(['- **Old** — `t.md`', '  - Kid — `k.md`']);
	});

	it('tables all notes with extra aliases, parents and escaped cells', () => {
		const index = build_structure_index([
			note('Z/1.md', 'Physik', ['Z/2.md']),
			note('Z/2.md', 'A | B', undefined, { aliases: ['A | B', 'Linse'] }),
			note('x/3.md', 'Out', undefined, { managed: false }),
			note('Z/sub/4.md', 'Deep'),
		]);
		const text = notes(index, CTX);
		expect(text).toContain('| 2 | A \\| B | Linse | 1 |  |');
		expect(text).toContain('| 1 | Physik [folder] |  |  |  |');
		expect(text).toContain('| 3 | Out [outside] |  |  | x/3.md |');
		expect(text).toContain('| 4 | Deep |  |  | Z/sub/4.md |');
		expect(structure(index, CTX)).not.toContain('| File name |');
	});

	it('writes notes in the vault root by file name if that is the inbox', () => {
		const index = build_structure_index([note('a.md', 'A'), note('Z/b.md', 'B')]);
		expect(section(structure(index, { ...CTX, inbox: '' }), 'Orphans')).toEqual(['- A — `a`', '- B — `Z/b.md`']);
	});

	it('is deterministic', () => {
		const inputs = [note('a.md', 'A', ['b.md']), note('b.md', 'B')];
		expect(render_structure_export(build_structure_index(inputs), CTX)).toEqual(
			render_structure_export(build_structure_index(inputs), CTX),
		);
	});
});
