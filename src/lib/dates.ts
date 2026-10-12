/** Orania-tyd; Suid-Afrika het geen somertyd nie. Datums word as dae in hierdie sone gewys. */
const TIME_ZONE = 'Africa/Johannesburg';

/** "10 November 2026" */
export const formatDate = (date: Date) =>
	new Intl.DateTimeFormat('af-ZA', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		timeZone: TIME_ZONE
	}).format(date);

/** Vir `<input type="date">`: "2026-11-10", of '' as daar geen datum is nie. */
export const toDateInput = (date: Date | null) =>
	date ? new Intl.DateTimeFormat('sv-SE', { timeZone: TIME_ZONE }).format(date) : '';
