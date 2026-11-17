import { describe, expect, it } from 'vitest';
import { compare_text } from './collate';

describe('compare_text', () => {
	it('sorts umlauts next to their base letter, independent of the device locale', () => {
		expect(['Zebra', 'Äpfel', 'Birne'].sort(compare_text)).toEqual(['Äpfel', 'Birne', 'Zebra']);
	});
});
