/**
 * Net paaie binne ons eie werf. Keer "open redirects" soos ?na=//skelm.example
 * of ?na=/\skelm.example (blaaiers lees albei as 'n ander gasheer).
 */
export function safeRedirect(target: string | undefined, fallback = '/') {
	if (!target || !target.startsWith('/') || /^\/[/\\]/.test(target)) return fallback;
	return target;
}
