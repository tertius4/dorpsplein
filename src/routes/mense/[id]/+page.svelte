<script lang="ts">
	import Avatar from '#lib/components/Avatar.svelte';
	import { getPublicProfile } from '#lib/remote/people.remote.ts';
	import type { PageProps } from './$types';

	let { params }: PageProps = $props();
	const person = $derived(await getPublicProfile(params.id));
</script>

<svelte:head>
	<title>{person.name} · Dorpsplein</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="mx-auto max-w-lg px-4 py-12">
	{#if person.isOwn}
		<p class="mb-6 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
			So sien ander jou profiel{person.isPublic ? '' : ' (privaat: net aangemelde lede)'}.
			<a href="/profiel" class="underline">Wysig</a>
		</p>
	{/if}

	<header class="flex items-center gap-4">
		<div class="relative shrink-0">
			<Avatar name={person.name} image={person.image} size={72} />
			{#if person.available}
				<span
					title="Oop vir werk"
					class="absolute right-0 bottom-0 h-5 w-5 rounded-full border-2 border-white bg-green-600"
				></span>
			{/if}
		</div>
		<div>
			<h1 class="text-2xl font-bold text-stone-900">{person.name}</h1>
			{#if person.headline}<p class="text-stone-700">{person.headline}</p>{/if}
			<p class="text-sm text-stone-500">Lid sedert {person.memberSince}</p>
		</div>
	</header>

	{#if person.available}
		<section role="status" class="mt-6 rounded-lg border border-green-300 bg-green-50 px-4 py-3">
			<p class="flex items-center gap-2 font-semibold text-green-900">
				<span class="h-2.5 w-2.5 rounded-full bg-green-600" aria-hidden="true"></span>
				Oop vir werk
			</p>
			{#if person.jobTypes.length > 0}
				<p class="mt-1 text-sm text-green-900">Soek: {person.jobTypes.join(' · ')}</p>
			{/if}
		</section>
	{:else}
		<section role="status" class="mt-6 rounded-lg border border-stone-200 bg-stone-100 px-4 py-3">
			<p class="font-semibold text-stone-700">Tans nie beskikbaar vir werk nie</p>
			{#if person.jobTypes.length > 0}
				<p class="mt-1 text-sm text-stone-600">Doen gewoonlik: {person.jobTypes.join(' · ')}</p>
			{/if}
		</section>
	{/if}

	<div class="mt-4 flex flex-wrap gap-2 text-sm">
		{#if person.driversLicence}
			<span class="rounded-full bg-stone-100 px-3 py-1 text-stone-700">🚗 Rybewys</span>
		{/if}
		{#if person.ownTransport}
			<span class="rounded-full bg-stone-100 px-3 py-1 text-stone-700">🛻 Eie vervoer</span>
		{/if}
	</div>

	{#if person.bio}
		<section class="mt-8">
			<h2 class="text-lg font-semibold text-stone-800">Oor my</h2>
			<p class="mt-2 whitespace-pre-line text-stone-700">{person.bio}</p>
		</section>
	{/if}

	{#if person.interests.length > 0}
		<section class="mt-8">
			<h2 class="text-lg font-semibold text-stone-800">Ervaring</h2>
			<ul class="mt-2 space-y-1">
				{#each person.interests as interest (interest.name)}
					<li class="text-stone-700">
						{interest.icon}
						{interest.name}
						{#if interest.yearsExperience}
							<span class="text-stone-500">
								· {interest.yearsExperience} jaar
							</span>
						{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if person.qualifications.length > 0}
		<section class="mt-8">
			<h2 class="text-lg font-semibold text-stone-800">Kwalifikasies</h2>
			<ul class="mt-2 space-y-1">
				{#each person.qualifications as q (q.id)}
					<li class="text-stone-700">
						{q.name}
						{#if q.issuer || q.year}
							<span class="text-stone-500">
								· {[q.issuer, q.year].filter(Boolean).join(', ')}
							</span>
						{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</main>
