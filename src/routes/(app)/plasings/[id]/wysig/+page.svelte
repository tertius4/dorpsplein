<script lang="ts">
	import ListingForm from '#lib/components/ListingForm.svelte';
	import { getListingForEdit } from '#lib/remote/listings.remote.ts';
	import type { PageProps } from './$types';

	let { params }: PageProps = $props();
	const listing = $derived(await getListingForEdit(params.id));
</script>

<svelte:head>
	<title>Wysig plasing · Dorpsplein</title>
</svelte:head>

<main class="mx-auto max-w-lg px-4 py-10">
	<a href="/plasings/{params.id}" class="text-sm text-stone-600 underline">← Terug</a>
	<h1 class="mt-2 mb-6 text-2xl font-bold text-stone-900">Wysig plasing</h1>
	{#key listing.id}
		<ListingForm initial={listing} submitLabel="Stoor" />
	{/key}
</main>
