<script lang="ts">
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

	const input = 'mt-1 block w-full rounded-md border-stone-300';
	const issues = (field: { issues(): { message: string }[] | undefined }) => field.issues() ?? [];
</script>

<form {...saveListing} class="space-y-6">
	<input {...f.requestId.as('hidden', requestId)} />
	<input {...f.id.as('hidden', initial.id ?? '')} />

	<label class="block">
		<span class="text-sm font-medium text-stone-700">Titel</span>
		<input
			{...f.title.as('text')}
			required
			maxlength="100"
			placeholder="bv. Hulp met die tuin"
			class={input}
		/>
		{#each issues(f.title) as issue (issue.message)}
			<span class="block text-sm text-red-700">{issue.message}</span>
		{/each}
	</label>

	<label class="block">
		<span class="text-sm font-medium text-stone-700">Kategorie</span>
		<select {...f.categoryId.as('select')} required class={input}>
			<option value="">Kies ’n kategorie</option>
			{#each options.categories as category (category.id)}
				<option value={category.id}>{category.icon} {category.name}</option>
			{/each}
		</select>
		{#each issues(f.categoryId) as issue (issue.message)}
			<span class="block text-sm text-red-700">{issue.message}</span>
		{/each}
	</label>

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

	<label class="block">
		<span class="text-sm font-medium text-stone-700">Beskrywing (opsioneel)</span>
		<textarea {...f.description.as('text')} rows="5" maxlength="2000" class={input}></textarea>
		{#each issues(f.description) as issue (issue.message)}
			<span class="block text-sm text-red-700">{issue.message}</span>
		{/each}
	</label>

	<div class="grid gap-4 sm:grid-cols-2">
		<label class="block">
			<span class="text-sm font-medium text-stone-700">Betaling (opsioneel)</span>
			<input {...f.price.as('text')} maxlength="100" placeholder="bv. R300 per dag" class={input} />
			{#each issues(f.price) as issue (issue.message)}
				<span class="block text-sm text-red-700">{issue.message}</span>
			{/each}
		</label>
		<label class="block">
			<span class="text-sm font-medium text-stone-700">Plek (opsioneel)</span>
			<input {...f.location.as('text')} maxlength="120" class={input} />
			{#each issues(f.location) as issue (issue.message)}
				<span class="block text-sm text-red-700">{issue.message}</span>
			{/each}
		</label>
	</div>

	<label class="block">
		<span class="text-sm font-medium text-stone-700">Hoeveel mense soek jy?</span>
		<input {...f.capacity.as('text')} inputmode="numeric" required class="{input} sm:w-32" />
		{#each issues(f.capacity) as issue (issue.message)}
			<span class="block text-sm text-red-700">{issue.message}</span>
		{/each}
	</label>

	<div class="grid gap-4 sm:grid-cols-3">
		<label class="block">
			<span class="text-sm font-medium text-stone-700">Begin (opsioneel)</span>
			<input {...f.startsAt.as('date')} class={input} />
			{#each issues(f.startsAt) as issue (issue.message)}
				<span class="block text-sm text-red-700">{issue.message}</span>
			{/each}
		</label>
		<label class="block">
			<span class="text-sm font-medium text-stone-700">Einde (opsioneel)</span>
			<input {...f.endsAt.as('date')} class={input} />
			{#each issues(f.endsAt) as issue (issue.message)}
				<span class="block text-sm text-red-700">{issue.message}</span>
			{/each}
		</label>
		<label class="block">
			<span class="text-sm font-medium text-stone-700">Reageer voor (opsioneel)</span>
			<input {...f.closesAt.as('date')} class={input} />
			{#each issues(f.closesAt) as issue (issue.message)}
				<span class="block text-sm text-red-700">{issue.message}</span>
			{/each}
		</label>
	</div>

	{#each f.issues() ?? [] as issue (issue.message)}
		<p class="text-sm text-red-700">{issue.message}</p>
	{/each}

	<button
		disabled={saveListing.pending > 0}
		class="w-full rounded-md bg-stone-900 px-4 py-2 font-medium text-white disabled:opacity-50"
	>
		{submitLabel}
	</button>
</form>
