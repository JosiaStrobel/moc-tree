/** Double click detection that survives re-rendering between the two clicks (no Obsidian dependency). */

/** Maximum time between two clicks of a double click, in ms. */
export const DOUBLE_CLICK_MS = 350;

/** Remembers the last click per key; a second click on the same key in time is a double click. */
export class DoubleClickTracker {
	private last: { key: string; time_ms: number } | null = null;

	/** Register a click; true if it completes a double click (the pair is then consumed). */
	click(key: string, time_ms: number): boolean {
		const last = this.last;
		if (last && last.key === key && time_ms - last.time_ms <= DOUBLE_CLICK_MS) {
			this.last = null;
			return true;
		}
		this.last = { key, time_ms };
		return false;
	}
}
