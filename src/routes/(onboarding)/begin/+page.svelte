<script lang="ts">
	import Card from '#lib/components/Card.svelte';
	import { getCurrentUser } from '#lib/remote/auth.remote.ts';

	const user = $derived(await getCurrentUser());
</script>

<svelte:head>
	<title>Welkom · Dorpsplein</title>
</svelte:head>

<main class="mx-auto max-w-lg px-4 py-12">
	<h1 class="text-2xl font-bold text-stone-900">Welkom, {user?.name}!</h1>
	<p class="mt-2 text-stone-600">Wat wil jy doen? Jy kan later altyd albei doen.</p>

	<div class="mt-8 grid gap-3">
		<Card href="/begin/werker">
			<span class="block font-semibold text-stone-900">Ek soek werk</span>
			<span class="block text-sm text-stone-600">
				Sê watter werk jy doen, dan hoor jy as iemand iets plaas wat pas.
			</span>
		</Card>
		<Card href="/begin/plaser">
			<span class="block font-semibold text-stone-900">Ek soek mense</span>
			<span class="block text-sm text-stone-600">
				Plaas werk, dan weet mense wat daarby pas daarvan.
			</span>
		</Card>
	</div>
</main>
