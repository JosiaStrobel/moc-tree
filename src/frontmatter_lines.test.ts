import { describe, expect, it } from 'vitest';
import {
	add_empty_list,
	insert_list_item,
	remove_key,
	remove_list_indices,
	remove_list_item,
	replace_list_item,
	set_scalar,
} from './frontmatter_lines';

/** Mixed-style frontmatter from the processFrontMatter probe. */
const PROBE = `---
# comment line
title: 'Probe note'
aliases: [Probe note, "Testnotiz", Probe]
tags:
- one
-   two
children:
  - "[[20261109153012-k7]]"
  - '[[20261109160045-p2]]'
number_like: 007
date: 2026-11-10
flag: yes
empty:
multiline: |
  line one
  line two
folded: >
  folded
  text
inline_obj: {a: 1, b: two}
url: https://example.com/a?b=c#d
colon_text: "a: b"
---
Body text with [[link]].

---
A horizontal rule above, not frontmatter.
`;

/** Lines that differ between two texts, as [line number, before, after]. */
function changed_lines(before: string, after: string): [number, string | undefined, string | undefined][] {
	const a = before.split('\n');
	const b = after.split('\n');
	const diff: [number, string | undefined, string | undefined][] = [];
	for (let i = 0; i < Math.max(a.length, b.length); i++) {
		if (a[i] !== b[i]) diff.push([i, a[i], b[i]]);
	}
	return diff;
}

describe('insert_list_item', () => {
	it('adds one line to the probe and leaves everything else untouched', () => {
		const result = insert_list_item(PROBE, 'children', '[[new]]');
		expect(result).toBe(PROBE.replace("  - '[[20261109160045-p2]]'\n", "  - '[[20261109160045-p2]]'\n  - \"[[new]]\"\n"));
	});

	it('inserts at a position', () => {
		const text = '---\nchildren:\n  - "[[a]]"\n  - "[[b]]"\n---\n';
		expect(insert_list_item(text, 'children', '[[x]]', 1)).toBe('---\nchildren:\n  - "[[a]]"\n  - "[[x]]"\n  - "[[b]]"\n---\n');
		expect(insert_list_item(text, 'children', '[[x]]', 0)).toBe('---\nchildren:\n  - "[[x]]"\n  - "[[a]]"\n  - "[[b]]"\n---\n');
	});

	it('keeps the existing indentation', () => {
		const text = '---\nchildren:\n- "[[a]]"\n---\n';
		expect(insert_list_item(text, 'children', '[[b]]')).toBe('---\nchildren:\n- "[[a]]"\n- "[[b]]"\n---\n');
	});

	it('does nothing if the item already exists', () => {
		expect(insert_list_item(PROBE, 'children', '[[20261109153012-k7]]')).toBe(PROBE);
	});

	it('turns an empty list into a block list', () => {
		expect(insert_list_item('---\nchildren: []\n---\n', 'children', '[[a]]')).toBe('---\nchildren:\n  - "[[a]]"\n---\n');
		expect(insert_list_item('---\nchildren:\n---\n', 'children', '[[a]]')).toBe('---\nchildren:\n  - "[[a]]"\n---\n');
	});

	it('keeps a non-empty flow list in flow style', () => {
		expect(insert_list_item(PROBE, 'aliases', 'Linse')).toBe(
			PROBE.replace('aliases: [Probe note, "Testnotiz", Probe]', 'aliases: [Probe note, "Testnotiz", Probe, "Linse"]'),
		);
	});

	it('creates the key or the whole frontmatter', () => {
		expect(insert_list_item('---\ntitle: A\n---\nBody', 'children', '[[a]]')).toBe('---\ntitle: A\nchildren:\n  - "[[a]]"\n---\nBody');
		expect(insert_list_item('Body', 'children', '[[a]]')).toBe('---\nchildren:\n  - "[[a]]"\n---\nBody');
	});

	it('keeps Windows line endings', () => {
		const text = '---\r\nchildren:\r\n  - "[[a]]"\r\n---\r\n';
		expect(insert_list_item(text, 'children', '[[b]]')).toBe('---\r\nchildren:\r\n  - "[[a]]"\r\n  - "[[b]]"\r\n---\r\n');
	});

	it('refuses unsafe forms', () => {
		expect(insert_list_item('---\nchildren:\n  - [[a]]\n---\n', 'children', '[[b]]')).toBeNull();
		expect(insert_list_item('---\nchildren:\n  # note\n  - "[[a]]"\n---\n', 'children', '[[b]]')).toBeNull();
		expect(insert_list_item('---\nchildren:\n  - a:\n      b\n---\n', 'children', '[[b]]')).toBeNull();
		expect(insert_list_item('---\nchildren: "[[a]]"\n---\n', 'children', '[[b]]')).toBeNull();
		expect(insert_list_item('---\nchildren: []\nchildren: []\n---\n', 'children', '[[b]]')).toBeNull();
		expect(insert_list_item('---\nchildren: []\n', 'children', '[[b]]')).toBeNull();
	});

	it('does not mistake a body horizontal rule for frontmatter', () => {
		const text = 'Intro\n---\nchildren: []\n---\n';
		expect(insert_list_item(text, 'children', '[[a]]')).toBe(`---\nchildren:\n  - "[[a]]"\n---\n${text}`);
	});
});

describe('remove_list_item', () => {
	it('removes only the matching line from the probe', () => {
		const result = remove_list_item(PROBE, 'children', '[[20261109153012-k7]]');
		expect(changed_lines(PROBE, result ?? '')[0]).toEqual([8, '  - "[[20261109153012-k7]]"', "  - '[[20261109160045-p2]]'"]);
		expect(result).toBe(PROBE.replace('  - "[[20261109153012-k7]]"\n', ''));
	});

	it('removes duplicates and leaves an empty list', () => {
		const text = '---\nchildren:\n  - "[[a]]"\n\n  - "[[a]]"\ntitle: A\n---\n';
		expect(remove_list_item(text, 'children', '[[a]]')).toBe('---\nchildren: []\ntitle: A\n---\n');
	});

	it('removes from flow lists', () => {
		expect(remove_list_item(PROBE, 'aliases', 'Testnotiz')).toBe(
			PROBE.replace('aliases: [Probe note, "Testnotiz", Probe]', 'aliases: [Probe note, Probe]'),
		);
	});

	it('does nothing if the item or key is missing', () => {
		expect(remove_list_item(PROBE, 'children', '[[x]]')).toBe(PROBE);
		expect(remove_list_item(PROBE, 'missing', '[[x]]')).toBe(PROBE);
		expect(remove_list_item('Body', 'children', '[[x]]')).toBe('Body');
	});
});

describe('replace_list_item', () => {
	it('replaces a flow item in place, keeping other items as written', () => {
		expect(replace_list_item(PROBE, 'aliases', 'Probe note', 'Probe renamed')).toBe(
			PROBE.replace('aliases: [Probe note, "Testnotiz", Probe]', 'aliases: [Probe renamed, "Testnotiz", Probe]'),
		);
	});

	it('replaces a block item and keeps its quote style', () => {
		const text = "---\naliases:\n  - 'Old'\n  - Other\n---\n";
		expect(replace_list_item(text, 'aliases', 'Old', 'New')).toBe("---\naliases:\n  - 'New'\n  - Other\n---\n");
	});

	it('removes the old item if the new one already exists', () => {
		const text = '---\naliases:\n  - Old\n  - New\n---\n';
		expect(replace_list_item(text, 'aliases', 'Old', 'New')).toBe('---\naliases:\n  - New\n---\n');
	});

	it('does nothing if the old item is missing', () => {
		expect(replace_list_item(PROBE, 'aliases', 'Missing', 'New')).toBe(PROBE);
	});
});

describe('set_scalar', () => {
	it('changes only the title line of the probe and keeps its quotes', () => {
		expect(set_scalar(PROBE, 'title', 'Probe renamed')).toBe(PROBE.replace("title: 'Probe note'", "title: 'Probe renamed'"));
	});

	it('quotes plain values only when needed', () => {
		expect(set_scalar('---\ntitle: A\n---\n', 'title', 'Kapitel: 1')).toBe('---\ntitle: "Kapitel: 1"\n---\n');
		expect(set_scalar('---\ntitle: A\n---\n', 'title', 'B')).toBe('---\ntitle: B\n---\n');
	});

	it('fills an empty value and creates missing keys', () => {
		expect(set_scalar('---\ntitle:\n---\n', 'title', 'A')).toBe('---\ntitle: A\n---\n');
		expect(set_scalar('Body', 'title', 'A')).toBe('---\ntitle: A\n---\nBody');
	});

	it('refuses multi-line values', () => {
		expect(set_scalar(PROBE, 'multiline', 'x')).toBeNull();
		expect(set_scalar(PROBE, 'folded', 'x')).toBeNull();
	});
});

describe('add_empty_list', () => {
	it('adds an empty list before the closing line', () => {
		expect(add_empty_list('---\ntitle: A\n---\nBody', 'children')).toBe('---\ntitle: A\nchildren: []\n---\nBody');
		expect(add_empty_list('Body', 'children')).toBe('---\nchildren: []\n---\nBody');
	});

	it('keeps an existing key with any value', () => {
		const text = '---\nchildren:\n  - "[[a]]"\n---\n';
		expect(add_empty_list(text, 'children')).toBe(text);
		expect(add_empty_list('---\nchildren:\n---\n', 'children')).toBe('---\nchildren:\n---\n');
	});
});

describe('remove_key', () => {
	it('removes only the block of the key from the probe', () => {
		const after = remove_key(PROBE, 'children');
		expect(after).not.toBeNull();
		const removed = PROBE.split('\n').filter((line) => !(after ?? '').split('\n').includes(line));
		expect(removed).toEqual(['children:', '  - "[[20261109153012-k7]]"', "  - '[[20261109160045-p2]]'"]);
		expect((after ?? '').split('\n')).toHaveLength(PROBE.split('\n').length - 3);
	});

	it('handles flow lists, missing keys and duplicates', () => {
		expect(remove_key('---\ntitle: A\nchildren: []\n---\n', 'children')).toBe('---\ntitle: A\n---\n');
		expect(remove_key('---\ntitle: A\n---\n', 'children')).toBe('---\ntitle: A\n---\n');
		expect(remove_key('---\nchildren: []\nchildren: []\n---\n', 'children')).toBeNull();
	});
});

describe('remove_list_indices', () => {
	it('removes block items by position, keeping equal items elsewhere', () => {
		const text = '---\nchildren:\n  - "[[a]]"\n  - "[[b]]"\n  - "[[a]]"\n---\n';
		expect(remove_list_indices(text, 'children', [2])).toBe('---\nchildren:\n  - "[[a]]"\n  - "[[b]]"\n---\n');
		expect(remove_list_indices(text, 'children', [0, 1, 2])).toBe('---\nchildren: []\n---\n');
	});

	it('removes flow items and ignores invalid positions', () => {
		expect(remove_list_indices('---\naliases: [a, b, a]\n---\n', 'aliases', [2, 7])).toBe('---\naliases: [a, b]\n---\n');
		const text = '---\naliases: [a]\n---\n';
		expect(remove_list_indices(text, 'aliases', [5])).toBe(text);
	});
});
