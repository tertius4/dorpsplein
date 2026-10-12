<script lang="ts">
	import type { Snippet } from 'svelte';

	/** 'n Leë lys: 'n stippellyn-blok met 'n titel, 'n kort verduideliking en 'n aksie. */
	const { title, children }: { title: string; children?: Snippet } = $props();
</script>

<section class="rounded-lg border border-dashed border-stone-300 p-6 text-center">
	<p class="font-semibold text-stone-900">{title}</p>
	{#if children}{@render children()}{/if}
</section>
