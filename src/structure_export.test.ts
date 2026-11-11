import { describe, expect, it } from 'vitest';
import { render_structure_export, type ExportContext } from './structure_export';
import { build_structure_index, type NoteInput } from './structure_index';

const CTX: ExportContext = { folders: ['Zettel', ''], structure_key: 'children', trash_tag: 'papierkorb' };

/** Build a note input; `kids` lists child paths (`!name` = dead link). */
function note(path: string, title: string | null, kids?: string[], extra: Partial<NoteInput> = {}): NoteInput {
	const basename = path.replace(/^.*\//, '').replace(/\.md$/, '');
	const children =
		kids?.map((kid) => (kid.startsWith('!') ? { link: kid.slice(1), path: null } : { link: kid, path: kid })) ??
		null;
	return { path, basename, title, aliases: [], managed: true, children, trashed: false, ...extra };
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
		const text = render_structure_export(build_structure_index([]), CTX);
		expect(text).toContain('`Zettel`, (whole vault)');
		expect(text).toContain('`#papierkorb`');
		expect(text).toContain('property `children` is a folder note');
	});

	it('renders the tree in list order with markers', () => {
		const index = build_structure_index([
			note('Z/1.md', 'Physik', ['Z/2.md', '!gone', 'Z/3.md']),
			note('Z/2.md', 'Optik', ['Z/3.md', 'Z/1.md']),
			note('Z/3.md', null),
			note('Z/4.md', 'Waise'),
		]);
		const text = render_structure_export(index, CTX);
		// Pure cycle without a real root: one member stands in at the top level.
		expect(section(text, 'Tree')).toEqual([
			'- **Optik** — `Z/2.md` [folder]',
			'  - 3 — `Z/3.md` [no title, in 2 folders]',
			'  - **Physik** — `Z/1.md` [folder]',
			'    - Optik — `Z/2.md` [contains itself, not expanded]',
			'    - gone — `[[gone]]` [not found]',
			'    - 3 — `Z/3.md` [no title, in 2 folders]',
		]);
		expect(section(text, 'Orphans')).toEqual(['- Waise — `Z/4.md`']);
	});

	it('expands a folder in several places only once', () => {
		const index = build_structure_index([
			note('a.md', 'A', ['s.md']),
			note('b.md', 'B', ['s.md']),
			note('s.md', 'Shared', ['n.md']),
			note('n.md', 'N'),
		]);
		expect(section(render_structure_export(index, CTX), 'Tree')).toEqual([
			'- **A** — `a.md` [folder]',
			'  - **Shared** — `s.md` [folder, in 2 folders]',
			'    - N — `n.md`',
			'- **B** — `b.md` [folder]',
			'  - **Shared** — `s.md` [folder, in 2 folders] (entries listed above)',
		]);
	});

	it('lists trashed notes only in the trash section', () => {
		const index = build_structure_index([
			note('p.md', 'P', ['t.md']),
			note('t.md', 'Old', ['k.md'], { trashed: true }),
			note('k.md', 'Kid'),
		]);
		const text = render_structure_export(index, CTX);
		expect(section(text, 'Tree')).toEqual(['- **P** — `p.md` [folder]']);
		expect(section(text, 'Trash')).toEqual(['- **Old** — `t.md` [folder]', '  - Kid — `k.md`']);
	});

	it('tables all notes with aliases, parents and escaped cells', () => {
		const index = build_structure_index([
			note('Z/1.md', 'Physik', ['Z/2.md']),
			note('Z/2.md', 'A | B', undefined, { aliases: ['A | B', 'Linse'] }),
			note('x/3.md', 'Out', undefined, { managed: false }),
		]);
		const text = render_structure_export(index, CTX);
		expect(text).toContain('| 2 | A \\| B | A \\| B, Linse | 1 | Z/2.md |');
		expect(text).toContain('| 1 | Physik [folder] |  |  | Z/1.md |');
		expect(text).toContain('| 3 | Out [outside] |  |  | x/3.md |');
	});

	it('is deterministic', () => {
		const inputs = [note('a.md', 'A', ['b.md']), note('b.md', 'B')];
		expect(render_structure_export(build_structure_index(inputs), CTX)).toBe(
			render_structure_export(build_structure_index(inputs), CTX),
		);
	});
});
