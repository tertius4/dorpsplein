<script lang="ts">
	import { getCategories } from '#lib/remote/categories.remote.ts';
	import { APP_ENV } from '$app/env/public';

	const STEPS = [
		{
			title: 'Skep jou profiel',
			text: 'Sê watter werk jy doen, hoeveel ervaring jy het, en wanneer jy beskikbaar is.'
		},
		{
			title: 'Kry ’n kennisgewing',
			text: 'Plaas iemand werk wat by jou pas, laat ons jou dadelik weet.'
		},
		{
			title: 'Maak ’n ooreenkoms',
			text: 'Sê jy is beskikbaar. As die werkgewer jou kies, kry julle mekaar se nommers.'
		}
	];
</script>

<svelte:head>
	<title>Dorpsplein · Waar Orania handel dryf</title>
	<meta
		name="description"
		content="Dorpsplein bring werkgewers en werknemers in Orania bymekaar."
	/>
</svelte:head>

<main class="mx-auto max-w-2xl px-4 py-12">
	<h1 class="text-3xl font-bold text-stone-900">
		Dorpsplein
		{#if APP_ENV !== 'production'}
			<span class="ml-2 rounded bg-amber-100 px-2 py-0.5 align-middle text-sm text-amber-800">
				{APP_ENV}
			</span>
		{/if}
	</h1>
	<p class="mt-2 text-lg text-stone-600">Waar Orania handel dryf.</p>
	<p class="mt-4 text-stone-700">
		Soek jy werk, of het jy iemand nodig vir ’n takie, seisoenwerk of ’n vaste pos? Dorpsplein bring
		mense in die dorp bymekaar.
	</p>

	<div class="mt-6 flex gap-3">
		<a href="/registreer" class="rounded-md bg-stone-900 px-4 py-2 font-medium text-white">
			Registreer gratis
		</a>
		<a href="/teken-in" class="rounded-md border border-stone-300 bg-white px-4 py-2 font-medium">
			Teken in
		</a>
	</div>

	<section class="mt-12">
		<h2 class="text-xl font-semibold text-stone-800">Hoe dit werk</h2>
		<ol class="mt-4 space-y-4">
			{#each STEPS as step, i (step.title)}
				<li class="flex gap-4">
					<span
						class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-900 font-semibold text-white"
					>
						{i + 1}
					</span>
					<span>
						<span class="font-medium text-stone-900">{step.title}</span>
						<span class="block text-stone-600">{step.text}</span>
					</span>
				</li>
			{/each}
		</ol>
	</section>

	<section class="mt-12">
		<h2 class="text-xl font-semibold text-stone-800">Werk-kategorieë</h2>
		<svelte:boundary>
			<ul class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
				{#each await getCategories('JOB') as category (category.id)}
					<li class="rounded-lg border border-stone-200 bg-white px-4 py-3 text-stone-800">
						{#if category.icon}<span aria-hidden="true">{category.icon}</span>{/if}
						{category.name}
					</li>
				{:else}
					<li class="col-span-full text-stone-500">Nog geen kategorieë nie.</li>
				{/each}
			</ul>

			{#snippet failed()}
				<p class="mt-4 text-red-700">Kon nie die kategorieë laai nie. Probeer later weer.</p>
			{/snippet}
		</svelte:boundary>
	</section>
</main>
