<script lang="ts">
	import { page } from '$app/state';

	const title = $derived(
		page.status === 404 ? 'Bladsy nie gevind nie' : 'Iets het verkeerd geloop'
	);
</script>

<svelte:head>
	<title>{title} · Dorpsplein</title>
</svelte:head>

<main class="mx-auto max-w-sm px-4 py-16 text-center">
	<p class="text-5xl font-bold text-stone-300">{page.status}</p>
	<h1 class="mt-4 text-2xl font-bold text-stone-900">{title}</h1>
	{#if page.error?.message}
		<p class="mt-2 text-stone-600">{page.error.message}</p>
	{/if}
	<a href="/" class="mt-8 inline-block rounded-md bg-stone-900 px-4 py-2 text-white">
		Terug na die begin
	</a>
</main>
