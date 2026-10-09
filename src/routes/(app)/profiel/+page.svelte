<script lang="ts">
	import {
		getMyProfile,
		setAvailable,
		updateAbout,
		updateInterests,
		updateJobPreferences
	} from '#lib/remote/profile.remote.ts';

	const me = $derived(await getMyProfile());
	const about = updateAbout.fields;
	const interests = updateInterests.fields;
	const work = updateJobPreferences.fields;
</script>

<svelte:head>
	<title>My profiel · Dorpsplein</title>
</svelte:head>

<main class="mx-auto max-w-lg space-y-10 px-4 py-12">
	<h1 class="text-2xl font-bold text-stone-900">My profiel</h1>

	<section class="rounded-lg border border-stone-200 bg-white p-4">
		<label class="flex items-center justify-between gap-4">
			<span>
				<span class="font-medium text-stone-900">Beskikbaar vir werk</span>
				<span class="block text-sm text-stone-600">Af = jy kry geen nuwe kennisgewings nie.</span>
			</span>
			<input
				type="checkbox"
				checked={me.available}
				onchange={(e) => setAvailable(e.currentTarget.checked)}
				class="h-5 w-5"
			/>
		</label>
	</section>

	<section>
		<h2 class="text-lg font-semibold text-stone-800">Oor my</h2>
		<form {...updateAbout} class="mt-4 space-y-4">
			<label class="block">
				<span class="text-sm font-medium text-stone-700">Naam en van</span>
				<input
					{...about.name.as('text', me.name)}
					autocomplete="name"
					required
					class="mt-1 block w-full rounded-md border-stone-300"
				/>
				{#each about.name.issues() ?? [] as issue (issue.message)}
					<span class="block text-sm text-red-700">{issue.message}</span>
				{/each}
			</label>

			<p class="text-sm text-stone-600">E-pos: {me.email}</p>

			<label class="block">
				<span class="text-sm font-medium text-stone-700">Beskryf jouself in een sin</span>
				<input
					{...about.headline.as('text', me.headline)}
					placeholder="bv. Ervare messelaar en teëlwerker"
					maxlength="80"
					class="mt-1 block w-full rounded-md border-stone-300"
				/>
				{#each about.headline.issues() ?? [] as issue (issue.message)}
					<span class="block text-sm text-red-700">{issue.message}</span>
				{/each}
			</label>

			<label class="block">
				<span class="text-sm font-medium text-stone-700">Oor my</span>
				<textarea
					{...about.bio.as('text', me.bio)}
					rows="4"
					maxlength="1000"
					placeholder="Jou ervaring, wat jy graag doen, wanneer jy beskikbaar is …"
					class="mt-1 block w-full rounded-md border-stone-300"></textarea>
				{#each about.bio.issues() ?? [] as issue (issue.message)}
					<span class="block text-sm text-red-700">{issue.message}</span>
				{/each}
			</label>

			<label class="block">
				<span class="text-sm font-medium text-stone-700">Selnommer</span>
				<input
					{...about.phone.as('tel', me.phone)}
					autocomplete="tel"
					required
					class="mt-1 block w-full rounded-md border-stone-300"
				/>
				<span class="text-xs text-stone-500">
					Word net gedeel met iemand met wie jy ooreenkom om te werk.
				</span>
				{#each about.phone.issues() ?? [] as issue (issue.message)}
					<span class="block text-sm text-red-700">{issue.message}</span>
				{/each}
			</label>

			{#each about.issues() ?? [] as issue (issue.message)}
				<p class="text-sm text-red-700">{issue.message}</p>
			{/each}
			{#if updateAbout.result?.saved}
				<p class="text-sm text-green-700">Gestoor ✓</p>
			{/if}
			<button
				disabled={updateAbout.pending > 0}
				class="rounded-md bg-stone-900 px-4 py-2 font-medium text-white disabled:opacity-50"
			>
				Stoor
			</button>
		</form>
	</section>

	<section>
		<h2 class="text-lg font-semibold text-stone-800">Waaroor wil jy hoor?</h2>
		<p class="mt-1 text-sm text-stone-600">Kies kategorieë, en hoeveel jaar ervaring jy het.</p>
		<form {...updateInterests} class="mt-4 space-y-2">
			{#each me.interests as item, i (item.categoryId)}
				<div class="flex items-center gap-3 rounded-md border border-stone-200 bg-white px-3 py-2">
					<input {...interests.interests[i].categoryId.as('hidden', item.categoryId)} />
					<label class="flex flex-1 items-center gap-2">
						<input {...interests.interests[i].selected.as('checkbox', item.selected)} />
						<span>{item.icon} {item.name}</span>
					</label>
					<label class="flex items-center gap-1 text-sm text-stone-600">
						<input
							{...interests.interests[i].years.as('text', item.years)}
							inputmode="numeric"
							maxlength="2"
							aria-label="Jare ervaring in {item.name}"
							class="w-12 rounded-md border-stone-300 text-right"
						/>
						jaar
					</label>
				</div>
			{/each}

			{#each interests.allIssues() ?? [] as issue (issue.message)}
				<p class="text-sm text-red-700">{issue.message}</p>
			{/each}
			{#if updateInterests.result?.saved}
				<p class="text-sm text-green-700">Gestoor ✓</p>
			{/if}
			<button
				disabled={updateInterests.pending > 0}
				class="rounded-md bg-stone-900 px-4 py-2 font-medium text-white disabled:opacity-50"
			>
				Stoor
			</button>
		</form>
	</section>

	<section>
		<h2 class="text-lg font-semibold text-stone-800">Watter soort werk?</h2>
		<form {...updateJobPreferences} class="mt-4 space-y-4">
			<div class="grid grid-cols-2 gap-2">
				{#each me.jobTypes as jobType (jobType.value)}
					<label
						class="flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2"
					>
						<input {...work.jobTypes.as('checkbox', jobType.value, jobType.selected)} />
						<span>{jobType.label}</span>
					</label>
				{/each}
			</div>
			{#each work.jobTypes.issues() ?? [] as issue (issue.message)}
				<p class="text-sm text-red-700">{issue.message}</p>
			{/each}

			<div class="space-y-2">
				<label class="flex items-center gap-2">
					<input {...work.driversLicence.as('checkbox', me.driversLicence)} />
					<span>Ek het ’n rybewys</span>
				</label>
				<label class="flex items-center gap-2">
					<input {...work.ownTransport.as('checkbox', me.ownTransport)} />
					<span>Ek het eie vervoer</span>
				</label>
			</div>

			{#each work.issues() ?? [] as issue (issue.message)}
				<p class="text-sm text-red-700">{issue.message}</p>
			{/each}
			{#if updateJobPreferences.result?.saved}
				<p class="text-sm text-green-700">Gestoor ✓</p>
			{/if}
			<button
				disabled={updateJobPreferences.pending > 0}
				class="rounded-md bg-stone-900 px-4 py-2 font-medium text-white disabled:opacity-50"
			>
				Stoor
			</button>
		</form>
	</section>
</main>
