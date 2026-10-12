<script lang="ts">
	import Card from '#lib/components/Card.svelte';
	import { inputClass } from '#lib/styles.ts';
	import Field from '#lib/components/Field.svelte';
	import Button from '#lib/components/Button.svelte';
	import { confirmAction } from '#lib/client/confirm.ts';
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
		const ok = await confirmAction({
			title: `Verwyder “${name}”?`,
			confirmLabel: 'Verwyder',
			danger: true
		});
		if (ok) await removeQualification(id);
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

	<section id="foto" class="flex scroll-mt-20 items-center gap-4">
		<Avatar name={me.name} image={me.photo} size={80} />
		<div class="space-y-2">
			<label
				class="inline-block cursor-pointer rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-800"
			>
				{isResizing || uploadPhoto.pending > 0 ? 'Besig…' : 'Kies ’n foto'}
				<input
					type="file"
					accept="image/*"
					class="sr-only"
					onchange={choosePhoto}
					disabled={uploadPhoto.pending > 0}
				/>
			</label>
			{#if me.hasOwnPhoto}
				<Button variant="danger-link" class="block" onclick={() => removePhoto()}>
					Verwyder foto
				</Button>
			{/if}
			{#each [...(uploadPhoto.fields.allIssues() ?? []).map((i) => i.message), photoError].filter(Boolean) as message (message)}
				<p class="text-sm text-red-700">{message}</p>
			{/each}
			<form {...uploadPhoto} bind:this={photoForm} enctype="multipart/form-data" class="hidden">
				<input {...uploadPhoto.fields.photo.as('file')} bind:this={photoInput} />
			</form>
		</div>
	</section>

	<Card>
		<label class="flex items-center justify-between gap-4">
			<span>
				<span class="font-medium text-stone-900">Beskikbaar vir werk</span>
				<span class="block text-sm text-stone-600">Af = jy kry geen nuwe kennisgewings nie.</span>
			</span>
			<input
				type="checkbox"
				checked={me.available}
				onchange={(e) => setAvailable(e.currentTarget.checked).updates(getMyProfile())}
				class="h-5 w-5"
			/>
		</label>
	</Card>

	<Card>
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
		<Button variant="link" class="mt-3 text-sm" href="/mense/{me.id}"
			>Sien my publieke profiel</Button
		>
	</Card>

	<section id="oor-my" class="scroll-mt-20">
		<h2 class="text-lg font-semibold text-stone-800">Oor my</h2>
		<form {...updateAbout} class="mt-4 space-y-4">
			<Field label="Naam en van" issues={about.name.issues() ?? []}
				><input
					{...about.name.as('text', me.name)}
					autocomplete="name"
					required
					class={inputClass}
				/></Field
			>

			<p class="text-sm text-stone-600">E-pos: {me.email}</p>

			<Field label="Beskryf jouself in een sin" issues={about.headline.issues() ?? []}
				><input
					{...about.headline.as('text', me.headline)}
					placeholder="bv. Ervare messelaar en teëlwerker"
					maxlength="80"
					class={inputClass}
				/></Field
			>

			<Field label="Oor my" issues={about.bio.issues() ?? []}
				><textarea
					{...about.bio.as('text', me.bio)}
					rows="4"
					maxlength="1000"
					placeholder="Jou ervaring, wat jy graag doen, wanneer jy beskikbaar is …"
					class={inputClass}></textarea></Field
			>

			<Field
				label="Selnommer"
				issues={about.phone.issues() ?? []}
				hint="Word net gedeel met iemand met wie jy ooreenkom om te werk."
				><input
					{...about.phone.as('tel', me.phone)}
					autocomplete="tel"
					required
					class={inputClass}
				/></Field
			>

			{#each about.issues() ?? [] as issue (issue.message)}
				<p class="text-sm text-red-700">{issue.message}</p>
			{/each}
			{#if updateAbout.result?.saved}
				<p class="text-sm text-green-700">Gestoor ✓</p>
			{/if}
			<Button type="submit" disabled={updateAbout.pending > 0}>Stoor</Button>
		</form>
	</section>

	<section id="belangstellings" class="scroll-mt-20">
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
			<Button type="submit" disabled={updateInterests.pending > 0}>Stoor</Button>
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

			{#each work.issues() ?? [] as issue (issue.message)}
				<p class="text-sm text-red-700">{issue.message}</p>
			{/each}
			{#if updateJobPreferences.result?.saved}
				<p class="text-sm text-green-700">Gestoor ✓</p>
			{/if}
			<Button type="submit" disabled={updateJobPreferences.pending > 0}>Stoor</Button>
		</form>
	</section>
	<section id="kwalifikasies" class="scroll-mt-20">
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
						<Button variant="danger-link" onclick={() => remove(q.id, q.name)}>Verwyder</Button>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="mt-2 text-sm text-stone-600">Nog geen kwalifikasies nie.</p>
		{/if}

		{#if me.canAddQualification}
			<form {...addQualification} class="mt-4 space-y-3 rounded-md bg-stone-100 p-3">
				<Field label="Kwalifikasie" issues={qualification.name.issues() ?? []}
					><input
						{...qualification.name.as('text')}
						placeholder="bv. Elektrisiën – Trade Test"
						maxlength="120"
						required
						class={inputClass}
					/></Field
				>
				<div class="grid grid-cols-3 gap-3">
					<label class="col-span-2 block">
						<span class="text-sm font-medium text-stone-700">Uitgereik deur</span>
						<input
							{...qualification.issuer.as('text')}
							placeholder="bv. SAQA"
							maxlength="120"
							class={inputClass}
						/>
						{#each qualification.issuer.issues() ?? [] as issue (issue.message)}
							<span class="block text-sm text-red-700">{issue.message}</span>
						{/each}
					</label>
					<Field label="Jaar" issues={qualification.year.issues() ?? []}
						><input
							{...qualification.year.as('text')}
							inputmode="numeric"
							maxlength="4"
							placeholder="2019"
							class={inputClass}
						/></Field
					>
				</div>
				{#each qualification.issues() ?? [] as issue (issue.message)}
					<p class="text-sm text-red-700">{issue.message}</p>
				{/each}
				<Button type="submit" disabled={addQualification.pending > 0}>Voeg by</Button>
			</form>
		{:else}
			<p class="mt-4 text-sm text-stone-600">Jy het die maksimum aantal kwalifikasies bereik.</p>
		{/if}
	</section>
</main>
