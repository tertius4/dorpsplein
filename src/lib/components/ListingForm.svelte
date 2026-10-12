<script lang="ts">
	import { inputClass } from '#lib/styles.ts';
	import Field from '#lib/components/Field.svelte';
	import Button from '#lib/components/Button.svelte';
	import { estimateRecipients, saveListing } from '#lib/remote/listings.remote.ts';
	import { getOnboardingOptions } from '#lib/remote/onboarding.remote.ts';

	interface Initial {
		id?: string;
		categoryId?: string;
		title?: string;
		description?: string;
		price?: string;
		location?: string;
		capacity?: string;
		startsAt?: string;
		endsAt?: string;
		closesAt?: string;
		jobType?: 'PERMANENT' | 'PART_TIME' | 'ODD_JOB' | 'SEASONAL';
		/** Iemand het reeds gereageer: kategorie en werktipe is gesluit. */
		locked?: boolean;
		minCapacity?: number;
	}

	const { initial = {}, submitLabel }: { initial?: Initial; submitLabel: string } = $props();

	const options = $derived(await getOnboardingOptions());
	const f = saveListing.fields;

	// Die vorm is 'n module-singleton: begin elke keer met die regte waardes, nie die vorige s'n nie.
	// svelte-ignore state_referenced_locally
	f.set({
		requestId: '',
		id: initial.id ?? '',
		categoryId: initial.categoryId ?? '',
		title: initial.title ?? '',
		description: initial.description ?? '',
		price: initial.price ?? '',
		location: initial.location ?? '',
		capacity: initial.capacity ?? '1',
		startsAt: initial.startsAt ?? '',
		endsAt: initial.endsAt ?? '',
		closesAt: initial.closesAt ?? '',
		jobType: initial.jobType ?? 'ODD_JOB'
	});

	// Een id per vorm; as die versoek herhaal word, doen die bediener dit net een keer.
	const requestId = crypto.randomUUID();

	// Regstreekse "± N mense": wag kort ná die laaste verandering, en ignoreer verouderde antwoorde.
	let recipients = $state<number | null>(null);
	$effect(() => {
		const categoryId = Number(f.categoryId.value());
		const jobType = f.jobType.value();
		if (!categoryId || !jobType) {
			recipients = null;
			return;
		}
		let stale = false;
		const timer = setTimeout(async () => {
			const count = await estimateRecipients({ categoryId, jobType });
			if (!stale) recipients = count;
		}, 300);
		return () => {
			stale = true;
			clearTimeout(timer);
		};
	});

	const issues = (field: { issues(): { message: string }[] | undefined }) => field.issues() ?? [];
</script>

<form {...saveListing} class="space-y-6">
	<input {...f.requestId.as('hidden', requestId)} />
	<input {...f.id.as('hidden', initial.id ?? '')} />

	<Field label="Titel" issues={issues(f.title)}
		><input
			{...f.title.as('text')}
			required
			maxlength="100"
			placeholder="bv. Hulp met die tuin"
			class={inputClass}
		/></Field
	>

	{#if initial.locked}
		<input {...f.categoryId.as('hidden', initial.categoryId ?? '')} />
		<input {...f.jobType.as('hidden', initial.jobType ?? 'ODD_JOB')} />
		<p class="rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
			Iemand het reeds gereageer, so die kategorie en soort werk kan nie meer verander nie.
		</p>
	{:else}
		<Field label="Kategorie" issues={issues(f.categoryId)}>
			<select {...f.categoryId.as('select')} required class={inputClass}>
				<option value="">Kies ’n kategorie</option>
				{#each options.categories as category (category.id)}
					<option value={category.id}>{category.icon} {category.name}</option>
				{/each}
			</select>
		</Field>

		<fieldset>
			<legend class="text-sm font-medium text-stone-700">Soort werk</legend>
			<div class="mt-1 grid grid-cols-2 gap-2">
				{#each options.jobTypes as jobType (jobType.value)}
					<label
						class="flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2"
					>
						<input {...f.jobType.as('radio', jobType.value)} />
						<span>{jobType.label}</span>
					</label>
				{/each}
			</div>
			{#each issues(f.jobType) as issue (issue.message)}
				<span class="block text-sm text-red-700">{issue.message}</span>
			{/each}
		</fieldset>
	{/if}

	<p
		class="rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700"
		aria-live="polite"
	>
		{#if recipients === null}
			Kies ’n kategorie om te sien hoeveel mense kennisgewing sal kry.
		{:else if recipients === 0}
			Tans pas niemand by hierdie plasing nie.
		{:else}
			± {recipients}
			{recipients === 1 ? 'persoon' : 'mense'} sal kennisgewing kry.
		{/if}
	</p>

	<Field label="Beskrywing (opsioneel)" issues={issues(f.description)}
		><textarea {...f.description.as('text')} rows="5" maxlength="2000" class={inputClass}
		></textarea></Field
	>

	<div class="grid gap-4 sm:grid-cols-2">
		<Field label="Betaling (opsioneel)" issues={issues(f.price)}
			><input
				{...f.price.as('text')}
				maxlength="100"
				placeholder="bv. R300 per dag"
				class={inputClass}
			/></Field
		>
		<Field label="Plek (opsioneel)" issues={issues(f.location)}
			><input {...f.location.as('text')} maxlength="120" class={inputClass} /></Field
		>
	</div>

	<Field label="Hoeveel mense soek jy?" issues={issues(f.capacity)}
		><input
			{...f.capacity.as('text')}
			inputmode="numeric"
			required
			class={[inputClass, 'sm:w-32']}
		/>
		{#if initial.minCapacity && initial.minCapacity > 1}
			<span class="block text-xs text-stone-500"
				>Minstens {initial.minCapacity}, want jy het reeds mense aanvaar.</span
			>
		{/if}</Field
	>

	<div class="grid gap-4 sm:grid-cols-3">
		<Field label="Begin (opsioneel)" issues={issues(f.startsAt)}
			><input {...f.startsAt.as('date')} class={inputClass} /></Field
		>
		<Field label="Einde (opsioneel)" issues={issues(f.endsAt)}
			><input {...f.endsAt.as('date')} class={inputClass} /></Field
		>
		<Field label="Reageer voor (opsioneel)" issues={issues(f.closesAt)}
			><input {...f.closesAt.as('date')} class={inputClass} /></Field
		>
	</div>

	{#each f.issues() ?? [] as issue (issue.message)}
		<p class="text-sm text-red-700">{issue.message}</p>
	{/each}

	<Button block type="submit" disabled={saveListing.pending > 0}>
		{submitLabel}
	</Button>
</form>
