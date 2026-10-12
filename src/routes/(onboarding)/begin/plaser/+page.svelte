<script lang="ts">
	import { completePosterOnboarding } from '#lib/remote/onboarding.remote.ts';

	const f = completePosterOnboarding.fields;
</script>

<svelte:head>
	<title>Welkom · Dorpsplein</title>
</svelte:head>

<main class="mx-auto max-w-lg px-4 py-12">
	<a href="/begin" class="text-sm text-stone-600 underline">← Terug</a>
	<h1 class="mt-2 text-2xl font-bold text-stone-900">Net een ding, dan kan jy plaas</h1>
	<p class="mt-2 text-stone-600">Wil jy ook self werk kry? Dit kan jy later by jou profiel doen.</p>

	<form {...completePosterOnboarding} class="mt-8 space-y-6">
		<label class="block">
			<span class="text-sm font-medium text-stone-700">Selnommer</span>
			<input
				{...f.phone.as('tel')}
				autocomplete="tel"
				required
				class="mt-1 block w-full rounded-md border-stone-300"
			/>
			<span class="text-xs text-stone-500"
				>Word net gedeel met iemand met wie jy ooreenkom om te werk.</span
			>
			{#each f.phone.issues() ?? [] as issue (issue.message)}
				<span class="block text-sm text-red-700">{issue.message}</span>
			{/each}
		</label>

		<label class="flex items-start gap-2">
			<input {...f.popiaConsent.as('checkbox')} class="mt-1" />
			<span class="text-sm text-stone-700">
				Ek stem in dat Dorpsplein my inligting verwerk soos beskryf in die
				<a href="/privaatheid" class="underline">privaatheidsbeleid</a>, en dat my naam en foto by
				my plasings verskyn. My e-pos en selnommer is nooit publiek nie.
			</span>
		</label>
		{#each f.popiaConsent.issues() ?? [] as issue (issue.message)}
			<p class="text-sm text-red-700">{issue.message}</p>
		{/each}

		{#each f.issues() ?? [] as issue (issue.message)}
			<p class="text-sm text-red-700">{issue.message}</p>
		{/each}

		<button
			disabled={completePosterOnboarding.pending > 0}
			class="w-full rounded-md bg-stone-900 px-4 py-2 font-medium text-white disabled:opacity-50"
		>
			Gaan voort
		</button>
	</form>
</main>
