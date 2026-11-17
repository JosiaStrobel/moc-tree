/** Device-independent text order; the structure file must be identical on every device. */

const COLLATOR = new Intl.Collator('en');

/** Compare two strings in a fixed locale, independent of the device language. */
export function compare_text(a: string, b: string): number {
	return COLLATOR.compare(a, b);
}
