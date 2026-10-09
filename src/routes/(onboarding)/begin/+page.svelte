<script lang="ts">
	import { getCurrentUser } from '#lib/remote/auth.remote.ts';
	import { completeOnboarding, getOnboardingOptions } from '#lib/remote/onboarding.remote.ts';

	const user = $derived(await getCurrentUser());
	const options = $derived(await getOnboardingOptions());
	const f = completeOnboarding.fields;
</script>

<svelte:head>
	<title>Welkom · Dorpsplein</title>
</svelte:head>

<main class="mx-auto max-w-lg px-4 py-12">
	<h1 class="text-2xl font-bold text-stone-900">Welkom, {user?.name}!</h1>
	<p class="mt-2 text-stone-600">Net ’n paar vrae, dan kan jy begin.</p>

	<form {...completeOnboarding} class="mt-8 space-y-8">
		<fieldset class="space-y-4">
			<legend class="text-lg font-semibold text-stone-800">1. Jou kontakbesonderhede</legend>
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
			<label class="block">
				<span class="text-sm font-medium text-stone-700"
					>Beskryf jouself in een sin (opsioneel)</span
				>
				<input
					{...f.headline.as('text')}
					placeholder="bv. Ervare messelaar en teëlwerker"
					maxlength="80"
					class="mt-1 block w-full rounded-md border-stone-300"
				/>
				{#each f.headline.issues() ?? [] as issue (issue.message)}
					<span class="block text-sm text-red-700">{issue.message}</span>
				{/each}
			</label>
		</fieldset>

		<fieldset>
			<legend class="text-lg font-semibold text-stone-800">2. Waaroor wil jy hoor?</legend>
			<div class="mt-3 grid grid-cols-2 gap-2">
				{#each options.categories as category (category.id)}
					<label
						class="flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2"
					>
						<input {...f.categoryIds.as('checkbox', category.id)} />
						<span>{category.icon} {category.name}</span>
					</label>
				{/each}
			</div>
			{#each f.categoryIds.issues() ?? [] as issue (issue.message)}
				<p class="mt-2 text-sm text-red-700">{issue.message}</p>
			{/each}
		</fieldset>

		<fieldset>
			<legend class="text-lg font-semibold text-stone-800">3. Watter soort werk?</legend>
			<div class="mt-3 grid grid-cols-2 gap-2">
				{#each options.jobTypes as jobType (jobType.value)}
					<label
						class="flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2"
					>
						<input {...f.jobTypes.as('checkbox', jobType.value)} />
						<span>{jobType.label}</span>
					</label>
				{/each}
			</div>
			{#each f.jobTypes.issues() ?? [] as issue (issue.message)}
				<p class="mt-2 text-sm text-red-700">{issue.message}</p>
			{/each}

			<div class="mt-4 space-y-2">
				<label class="flex items-center gap-2">
					<input {...f.driversLicence.as('checkbox')} />
					<span>Ek het ’n rybewys</span>
				</label>
				<label class="flex items-center gap-2">
					<input {...f.ownTransport.as('checkbox')} />
					<span>Ek het eie vervoer</span>
				</label>
			</div>
		</fieldset>

		<fieldset>
			<legend class="text-lg font-semibold text-stone-800">4. Privaatheid</legend>
			<label class="mt-3 flex items-start gap-2">
				<input {...f.popiaConsent.as('checkbox')} class="mt-1" />
				<span class="text-sm text-stone-700">
					Ek stem in dat Dorpsplein my inligting verwerk soos beskryf in die
					<a href="/privaatheid" class="underline">privaatheidsbeleid</a>.
				</span>
			</label>
			{#each f.popiaConsent.issues() ?? [] as issue (issue.message)}
				<p class="mt-2 text-sm text-red-700">{issue.message}</p>
			{/each}
		</fieldset>

		{#each f.issues() ?? [] as issue (issue.message)}
			<p class="text-sm text-red-700">{issue.message}</p>
		{/each}

		<button
			disabled={completeOnboarding.pending > 0}
			class="w-full rounded-md bg-stone-900 px-4 py-2 font-medium text-white disabled:opacity-50"
		>
			Begin
		</button>
	</form>
</main>
