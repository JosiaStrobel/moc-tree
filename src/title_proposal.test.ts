import { describe, expect, it } from 'vitest';
import { plain_heading, propose_title } from './title_proposal';

describe('plain_heading', () => {
	it('removes links, emphasis and code marks', () => {
		expect(plain_heading('**Optik** und [[2026|Linsen]]')).toBe('Optik und Linsen');
		expect(plain_heading('[[Wellen]] in `code` und [Text](http://x)')).toBe('Wellen in code und Text');
		expect(plain_heading('  viel   Platz _hier_ ')).toBe('viel Platz hier');
	});
});

describe('propose_title', () => {
	it('prefers the first level-1 heading', () => {
		const headings = [
			{ heading: 'Unterpunkt', level: 2 },
			{ heading: 'Haupttitel', level: 1 },
			{ heading: 'Zweiter', level: 1 },
		];
		expect(propose_title(headings, 'datei')).toBe('Haupttitel');
	});

	it('falls back to the file name', () => {
		expect(propose_title(undefined, 'Meine Notiz')).toBe('Meine Notiz');
		expect(propose_title([{ heading: 'Nur H2', level: 2 }], 'x')).toBe('x');
		expect(propose_title([{ heading: '**  **', level: 1 }], 'x')).toBe('x');
	});
});
