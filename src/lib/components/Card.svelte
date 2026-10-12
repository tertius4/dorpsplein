<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		href?: string;
		id?: string;
		class?: string;
		children: Snippet;
	}

	/** 'n Wit blok met 'n rand. Met `href` is dit 'n skakel (bv. 'n ry in 'n lys). */
	const { href, id, class: className, children }: Props = $props();
	const base = 'rounded-lg border border-stone-200 bg-white p-4';
</script>

{#if href !== undefined}
	<a {href} {id} class={[base, 'block hover:border-stone-400', className]}>
		{@render children()}
	</a>
{:else}
	<section {id} class={[base, className]}>{@render children()}</section>
{/if}
