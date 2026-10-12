<script lang="ts">
	import type { Snippet } from 'svelte';

	type Tone = 'neutral' | 'dark' | 'amber' | 'green';

	const { tone = 'neutral', children }: { tone?: Tone; children: Snippet } = $props();

	// Groen is net vir beskikbaarheid (en 'n oop plasing).
	const TONES: Record<Tone, string> = {
		neutral: 'bg-stone-100 text-stone-600',
		dark: 'bg-stone-900 text-white',
		amber: 'bg-amber-100 text-amber-900',
		green: 'bg-green-100 text-green-900'
	};
</script>

<span class="shrink-0 rounded-full px-2 py-0.5 text-xs {TONES[tone]}">{@render children()}</span>
