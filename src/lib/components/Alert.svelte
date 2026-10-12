<script lang="ts">
	import type { Snippet } from 'svelte';

	type Tone = 'error' | 'success' | 'info';

	const {
		tone = 'info',
		class: className,
		children
	}: { tone?: Tone; class?: string; children: Snippet } = $props();

	const TONES: Record<Tone, string> = {
		error: 'bg-red-50 text-red-800',
		success: 'bg-green-50 text-green-800',
		info: 'bg-amber-50 text-amber-900'
	};
</script>

<p
	role={tone === 'error' ? 'alert' : 'status'}
	class={['rounded-md px-3 py-2 text-sm', TONES[tone], className]}
>
	{@render children()}
</p>
