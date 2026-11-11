import { describe, expect, it } from 'vitest';
import { DoubleClickTracker } from './double_click';

describe('DoubleClickTracker', () => {
	it('detects two quick clicks on the same key', () => {
		const tracker = new DoubleClickTracker();
		expect(tracker.click('a', 1000)).toBe(false);
		expect(tracker.click('a', 1200)).toBe(true);
	});

	it('ignores slow clicks, other keys and a third click', () => {
		const tracker = new DoubleClickTracker();
		tracker.click('a', 0);
		expect(tracker.click('a', 500)).toBe(false);
		expect(tracker.click('b', 600)).toBe(false);
		expect(tracker.click('b', 700)).toBe(true);
		expect(tracker.click('b', 800)).toBe(false);
	});
});
