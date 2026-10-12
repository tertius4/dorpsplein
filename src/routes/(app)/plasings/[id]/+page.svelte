<script lang="ts">
	import Avatar from '#lib/components/Avatar.svelte';
	import { cancelListing, completeListing, getListing } from '#lib/remote/listings.remote.ts';
	import { goto } from '$app/navigation';
	import type { PageProps } from './$types';

	let { params }: PageProps = $props();
	const listing = $derived(await getListing(params.id));
	let error = $state('');

	async function change(action: typeof cancelListing | typeof completeListing, question: string) {
		if (!confirm(question)) return;
		error = '';
		try {
			await action({ id: listing.id, requestId: crypto.randomUUID() });
			await goto('/plasings');
		} catch (e) {
			error = (e as { body?: { message?: string } }).body?.message ?? 'Iets het skeefgeloop';
		}
	}
</script>

<svelte:head>
	<title>{listing.title} · Dorpsplein</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="mx-auto max-w-lg space-y-6 px-4 py-10">
	{#if listing.isOwner}
		<a href="/plasings" class="text-sm text-stone-600 underline">← My plasings</a>
	{/if}

	<header>
		<div class="flex items-start justify-between gap-3">
			<h1 class="text-2xl font-bold text-stone-900">{listing.title}</h1>
			<span
				class="shrink-0 rounded-full px-2 py-0.5 text-xs {listing.isOpen
					? 'bg-green-100 text-green-900'
					: 'bg-stone-100 text-stone-600'}">{listing.statusLabel}</span
			>
		</div>
		<p class="mt-1 text-stone-600">
			{listing.icon}
			{listing.category} · {listing.jobType}
		</p>
	</header>

	<dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
		{#if listing.price}<dt class="text-stone-500">Betaling</dt>
			<dd>{listing.price}</dd>{/if}
		{#if listing.location}<dt class="text-stone-500">Plek</dt>
			<dd>{listing.location}</dd>{/if}
		<dt class="text-stone-500">Mense gesoek</dt>
		<dd>{listing.capacity}</dd>
		{#if listing.startsAt}<dt class="text-stone-500">Begin</dt>
			<dd>{listing.startsAt}</dd>{/if}
		{#if listing.endsAt}<dt class="text-stone-500">Einde</dt>
			<dd>{listing.endsAt}</dd>{/if}
		{#if listing.closesAt}<dt class="text-stone-500">Reageer voor</dt>
			<dd>{listing.closesAt}</dd>{/if}
	</dl>

	{#if listing.description}
		<p class="whitespace-pre-line text-stone-800">{listing.description}</p>
	{/if}

	<section class="rounded-lg border border-stone-200 bg-white p-4">
		<h2 class="text-sm font-semibold text-stone-500">Geplaas deur</h2>
		<a href="/mense/{listing.owner.id}" class="mt-2 flex items-center gap-3">
			<Avatar name={listing.owner.name} image={listing.owner.image} size={44} />
			<span>
				<span class="block font-semibold text-stone-900">{listing.owner.name}</span>
				{#if listing.owner.headline}
					<span class="block text-sm text-stone-600">{listing.owner.headline}</span>
				{/if}
			</span>
		</a>
		<p class="mt-2 text-xs text-stone-500">Geplaas op {listing.postedAt}</p>
	</section>

	{#if listing.isOwner && listing.isOpen}
		<section class="flex flex-wrap gap-2">
			<a
				href="/plasings/{listing.id}/wysig"
				class="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white">Wysig</a
			>
			<button
				type="button"
				onclick={() => change(completeListing, 'Merk hierdie plasing as voltooi?')}
				class="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-800"
				>Voltooi</button
			>
			<button
				type="button"
				onclick={() => change(cancelListing, 'Kanselleer hierdie plasing?')}
				class="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-800"
				>Kanselleer</button
			>
		</section>
		{#if error}<p class="text-sm text-red-700">{error}</p>{/if}
	{/if}
</main>
