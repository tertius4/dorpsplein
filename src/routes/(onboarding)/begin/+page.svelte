<script lang="ts">
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
		<a
			href="/begin/werker"
			class="rounded-lg border border-stone-200 bg-white p-4 hover:border-stone-400"
		>
			<span class="block font-semibold text-stone-900">Ek soek werk</span>
			<span class="block text-sm text-stone-600">
				Sê watter werk jy doen, dan hoor jy as iemand iets plaas wat pas.
			</span>
		</a>
		<a
			href="/begin/plaser"
			class="rounded-lg border border-stone-200 bg-white p-4 hover:border-stone-400"
		>
			<span class="block font-semibold text-stone-900">Ek soek mense</span>
			<span class="block text-sm text-stone-600">
				Plaas werk, dan weet mense wat daarby pas daarvan.
			</span>
		</a>
	</div>
</main>
