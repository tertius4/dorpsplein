/** Klasse wat op meer as een plek nodig is, op een plek. Komponente in `components/` gebruik dit. */

export type ButtonVariant =
	'primary' | 'secondary' | 'danger' | 'destructive' | 'link' | 'subtle' | 'danger-link';
export type ButtonSize = 'sm' | 'md';

const VARIANTS: Record<ButtonVariant, string> = {
	primary: 'bg-stone-900 text-white',
	secondary: 'border border-stone-300 bg-white text-stone-800',
	danger: 'border border-red-300 text-red-800',
	// Vir 'n bevestiging van iets wat nie ongedaan gemaak kan word nie.
	destructive: 'bg-red-700 text-white',
	// Teks-skakels: geen vorm nie, net onderstreep.
	link: 'underline',
	subtle: 'text-sm text-stone-600 underline',
	'danger-link': 'text-sm text-red-700 underline'
};

const SOLID = new Set<ButtonVariant>(['primary', 'secondary', 'danger', 'destructive']);

const SIZES: Record<ButtonSize, string> = {
	sm: 'px-3 py-1.5 text-sm',
	md: 'px-4 py-2'
};

/** Klasse vir 'n knoppie of skakel. Ook vir elemente wat soos 'n knoppie lyk (bv. 'n `<label>` vir 'n lêer). */
export function buttonClass(
	options: { variant?: ButtonVariant; size?: ButtonSize; block?: boolean } = {}
) {
	const { variant = 'primary', size = 'md', block = false } = options;
	if (!SOLID.has(variant)) return VARIANTS[variant];
	return [
		'inline-block rounded-md text-center font-medium disabled:opacity-50',
		VARIANTS[variant],
		SIZES[size],
		block && 'w-full'
	]
		.filter(Boolean)
		.join(' ');
}

/** Teksvelde, areas en keuselyste. */
export const inputClass = 'mt-1 block w-full rounded-md border-stone-300';
