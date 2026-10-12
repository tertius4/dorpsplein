<script lang="ts">
	import Button from '#lib/components/Button.svelte';
	import { page } from '$app/state';

	const error = $derived(page.url.searchParams.get('error'));
</script>

<svelte:head><title>E-pos bevestig · Dorpsplein</title></svelte:head>

<main class="mx-auto max-w-sm px-4 py-12">
	{#if error}
		<h1 class="text-2xl font-bold text-stone-900">Die skakel werk nie</h1>
		<p class="mt-4 text-stone-700">
			{error === 'TOKEN_EXPIRED' ? 'Die skakel het verval.' : 'Die skakel is ongeldig.'}
			<Button variant="link" href="/teken-in">Teken in</Button> om ’n nuwe een te kry.
		</p>
	{:else}
		<h1 class="text-2xl font-bold text-stone-900">Jou e-pos is bevestig 🎉</h1>
		<p class="mt-4 text-stone-700">Welkom by Dorpsplein.</p>
		<Button class="mt-6" href="/">Gaan voort</Button>
	{/if}
</main>
