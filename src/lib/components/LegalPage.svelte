<script lang="ts">
	import Alert from '#lib/components/Alert.svelte';
	import type { Snippet } from 'svelte';

	let { title, updated, children }: { title: string; updated: string; children: Snippet } =
		$props();
</script>

<svelte:head>
	<title>{title} · Dorpsplein</title>
</svelte:head>

<main class="mx-auto max-w-2xl px-4 py-12">
	<Alert class="mb-6">
		Konsep: hierdie teks moet nog deur iemand met regskennis nagegaan word.
	</Alert>
	<h1 class="text-3xl font-bold text-stone-900">{title}</h1>
	<p class="mt-1 text-sm text-stone-500">Laas bygewerk: {updated}</p>
	<div
		class="mt-8 space-y-4 text-stone-700 [&_a]:underline [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-stone-900 [&_li]:ml-5 [&_li]:list-disc"
	>
		{@render children()}
	</div>
</main>
