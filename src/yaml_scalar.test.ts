import { describe, expect, it } from 'vitest';
import { format_scalar, needs_quotes, parse_scalar, split_flow_sequence } from './yaml_scalar';

describe('parse_scalar', () => {
	it('reads plain, double and single quoted values', () => {
		expect(parse_scalar('Lenses')).toEqual({ value: 'Lenses', quote: '' });
		expect(parse_scalar('"[[a]]"')).toEqual({ value: '[[a]]', quote: '"' });
		expect(parse_scalar("'it''s'")).toEqual({ value: "it's", quote: "'" });
		expect(parse_scalar('"a \\"b\\""')).toEqual({ value: 'a "b"', quote: '"' });
	});

	it('ignores trailing comments', () => {
		expect(parse_scalar('Lenses # note')).toEqual({ value: 'Lenses', quote: '' });
		expect(parse_scalar('"x" # note')).toEqual({ value: 'x', quote: '"' });
	});

	it('rejects unsupported forms', () => {
		for (const raw of ['[[a]]', '|', '>', '&anchor x', '*ref', '{a: 1}', 'a: b', '"open', '"x" y', '# c', '']) {
			expect(parse_scalar(raw)).toBeNull();
		}
	});
});

describe('format_scalar', () => {
	it('keeps plain values plain when safe', () => {
		expect(format_scalar('Optische Linsen', '')).toBe('Optische Linsen');
	});

	it('quotes values YAML would misread', () => {
		for (const value of ['007', 'yes', 'a: b', 'a #b', '[[a]]', '- x', ' x', '']) {
			expect(needs_quotes(value, false)).toBe(true);
		}
		expect(format_scalar('Kapitel: 1', '')).toBe('"Kapitel: 1"');
		expect(needs_quotes('a, b', true)).toBe(true);
		expect(needs_quotes('a, b', false)).toBe(false);
	});

	it('keeps a preferred quote style', () => {
		expect(format_scalar("it's", "'")).toBe("'it''s'");
		expect(format_scalar('x', '"')).toBe('"x"');
	});

	it('round-trips through parse_scalar', () => {
		for (const value of ['a "b"', "it's", 'Kapitel: 1', '[[x|y]]', 'Ümlaut']) {
			for (const quote of ['', '"', "'"] as const) {
				expect(parse_scalar(format_scalar(value, quote))?.value).toBe(value);
			}
		}
	});
});

describe('split_flow_sequence', () => {
	it('splits items and respects quotes', () => {
		expect(split_flow_sequence('[a, "b, c", \'d\']')).toEqual(['a', '"b, c"', "'d'"]);
		expect(split_flow_sequence('[]')).toEqual([]);
		expect(split_flow_sequence('[a,]')).toEqual(['a']);
	});

	it('rejects nested or broken sequences', () => {
		expect(split_flow_sequence('[[a]]')).toBeNull();
		expect(split_flow_sequence('[a, {b: 1}]')).toBeNull();
		expect(split_flow_sequence('[a, "b]')).toBeNull();
		expect(split_flow_sequence('[a,, b]')).toBeNull();
	});
});
