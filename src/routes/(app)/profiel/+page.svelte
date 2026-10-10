<script lang="ts">
	import { resizeImage } from '#lib/client/resize-image.ts';
	import Avatar from '#lib/components/Avatar.svelte';
	import {
		addQualification,
		getMyProfile,
		removePhoto,
		removeQualification,
		setAvailable,
		setPublicProfile,
		updateAbout,
		updateInterests,
		updateJobPreferences,
		uploadPhoto
	} from '#lib/remote/profile.remote.ts';

	const me = $derived(await getMyProfile());
	const about = updateAbout.fields;
	const interests = updateInterests.fields;
	const work = updateJobPreferences.fields;
	const qualification = addQualification.fields;

	async function remove(id: string, name: string) {
		if (confirm(`Verwyder “${name}”?`)) await removeQualification(id);
	}

	let photoForm: HTMLFormElement;
	let photoInput: HTMLInputElement;
	let isResizing = $state(false);
	let photoError = $state('');

	/** Verklein in die blaaier (verwyder ook GPS-metadata), dan dien die versteekte vorm in. */
	async function choosePhoto(event: Event & { currentTarget: HTMLInputElement }) {
		const picker = event.currentTarget;
		const file = picker.files?.[0];
		if (!file) return;

		photoError = '';
		isResizing = true;
		try {
			const small = await resizeImage(file);
			const transfer = new DataTransfer();
			transfer.items.add(small);
			photoInput.files = transfer.files;
			photoForm.requestSubmit();
		} catch {
			photoError = 'Kon nie die foto lees nie. Probeer ’n ander een.';
		} finally {
			isResizing = false;
			picker.value = '';
		}
	}
</script>

<svelte:head>
	<title>My profiel · Dorpsplein</title>
</svelte:head>

<main class="mx-auto max-w-lg space-y-10 px-4 py-12">
	<h1 class="text-2xl font-bold text-stone-900">My profiel</h1>

	<section class="flex items-center gap-4">
		<Avatar name={me.name} image={me.photo} size={80} />
		<div class="space-y-2">
			<label
				class="inline-block cursor-pointer rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-800"
			>
				{isResizing || uploadPhoto.pending > 0 ? 'Besig…' : 'Kies ’n foto'}
				<input type="file" accept="image/*" class="sr-only" onchange={choosePhoto} />
			</label>
			{#if me.hasOwnPhoto}
				<button
					type="button"
					onclick={() => removePhoto()}
					class="block text-sm text-red-700 underline"
				>
					Verwyder foto
				</button>
			{/if}
			{#each [...(uploadPhoto.fields.allIssues() ?? []).map((i) => i.message), photoError].filter(Boolean) as message (message)}
				<p class="text-sm text-red-700">{message}</p>
			{/each}
			<form {...uploadPhoto} bind:this={photoForm} enctype="multipart/form-data" class="hidden">
				<input {...uploadPhoto.fields.photo.as('file')} bind:this={photoInput} />
			</form>
		</div>
	</section>

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

	<section class="rounded-lg border border-stone-200 bg-white p-4">
		<label class="flex items-center justify-between gap-4">
			<span>
				<span class="font-medium text-stone-900">Wys my profiel publiek</span>
				<span class="block text-sm text-stone-600">
					Af = net aangemelde Dorpsplein-lede kan dit sien. Jou e-pos en selnommer is nooit sigbaar
					nie.
				</span>
			</span>
			<input
				type="checkbox"
				checked={me.publicProfile}
				onchange={(e) => setPublicProfile(e.currentTarget.checked)}
				class="h-5 w-5"
			/>
		</label>
		<a href="/mense/{me.id}" class="mt-3 inline-block text-sm underline">Sien my publieke profiel</a
		>
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
	<section>
		<h2 class="text-lg font-semibold text-stone-800">Kwalifikasies</h2>
		{#if me.qualifications.length > 0}
			<ul class="mt-4 space-y-2">
				{#each me.qualifications as q (q.id)}
					<li
						class="flex items-center justify-between gap-3 rounded-md border border-stone-200 bg-white px-3 py-2"
					>
						<span>
							<span class="text-stone-900">{q.name}</span>
							{#if q.issuer || q.year}
								<span class="block text-sm text-stone-500">
									{[q.issuer, q.year].filter(Boolean).join(', ')}
								</span>
							{/if}
						</span>
						<button
							type="button"
							onclick={() => remove(q.id, q.name)}
							class="text-sm text-red-700 underline"
						>
							Verwyder
						</button>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="mt-2 text-sm text-stone-600">Nog geen kwalifikasies nie.</p>
		{/if}

		{#if me.canAddQualification}
			<form {...addQualification} class="mt-4 space-y-3 rounded-md bg-stone-100 p-3">
				<label class="block">
					<span class="text-sm font-medium text-stone-700">Kwalifikasie</span>
					<input
						{...qualification.name.as('text')}
						placeholder="bv. Elektrisiën – Trade Test"
						maxlength="120"
						required
						class="mt-1 block w-full rounded-md border-stone-300"
					/>
					{#each qualification.name.issues() ?? [] as issue (issue.message)}
						<span class="block text-sm text-red-700">{issue.message}</span>
					{/each}
				</label>
				<div class="grid grid-cols-3 gap-3">
					<label class="col-span-2 block">
						<span class="text-sm font-medium text-stone-700">Uitgereik deur</span>
						<input
							{...qualification.issuer.as('text')}
							placeholder="bv. SAQA"
							maxlength="120"
							class="mt-1 block w-full rounded-md border-stone-300"
						/>
						{#each qualification.issuer.issues() ?? [] as issue (issue.message)}
							<span class="block text-sm text-red-700">{issue.message}</span>
						{/each}
					</label>
					<label class="block">
						<span class="text-sm font-medium text-stone-700">Jaar</span>
						<input
							{...qualification.year.as('text')}
							inputmode="numeric"
							maxlength="4"
							placeholder="2019"
							class="mt-1 block w-full rounded-md border-stone-300"
						/>
						{#each qualification.year.issues() ?? [] as issue (issue.message)}
							<span class="block text-sm text-red-700">{issue.message}</span>
						{/each}
					</label>
				</div>
				{#each qualification.issues() ?? [] as issue (issue.message)}
					<p class="text-sm text-red-700">{issue.message}</p>
				{/each}
				<button
					disabled={addQualification.pending > 0}
					class="rounded-md bg-stone-900 px-4 py-2 font-medium text-white disabled:opacity-50"
				>
					Voeg by
				</button>
			</form>
		{:else}
			<p class="mt-4 text-sm text-stone-600">Jy het die maksimum aantal kwalifikasies bereik.</p>
		{/if}
	</section>
</main>
