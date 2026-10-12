<script lang="ts">
	import Button from '#lib/components/Button.svelte';
	import { confirmAction, type ConfirmOptions } from '#lib/client/confirm.ts';
	import Avatar from '#lib/components/Avatar.svelte';
	import ContactCard from '#lib/components/ContactCard.svelte';
	import ResponseBadge from '#lib/components/ResponseBadge.svelte';
	import {
		acceptResponse,
		declineResponse,
		getResponsesForListing
	} from '#lib/remote/responses.remote.ts';

	const { listingId }: { listingId: string } = $props();
	const data = $derived(await getResponsesForListing(listingId));
	let error = $state('');

	async function decide(
		action: typeof acceptResponse | typeof declineResponse,
		id: string,
		options: ConfirmOptions
	) {
		if (!(await confirmAction(options))) return;
		error = '';
		try {
			await action({ id, requestId: crypto.randomUUID() });
		} catch (e) {
			error = (e as { body?: { message?: string } }).body?.message ?? 'Iets het skeefgeloop';
		}
	}
</script>

<section class="space-y-3">
	<h2 class="font-semibold text-stone-900">Reaksies ({data.responses.length})</h2>
	<p class="text-sm text-stone-600">{data.accepted} van {data.capacity} plekke gevul.</p>

	{#if data.responses.length === 0}
		<p class="rounded-lg border border-dashed border-stone-300 p-4 text-sm text-stone-600">
			Niemand het nog gereageer nie.
		</p>
	{/if}

	<ul class="space-y-3">
		{#each data.responses as r (r.id)}
			<li class="space-y-3 rounded-lg border border-stone-200 bg-white p-4">
				<div class="flex items-start justify-between gap-3">
					<a href="/mense/{r.responder.id}" class="flex items-center gap-3">
						<Avatar name={r.responder.name} image={r.responder.image} size={40} />
						<span>
							<span class="block font-semibold text-stone-900">{r.responder.name}</span>
							{#if r.responder.headline}
								<span class="block text-sm text-stone-600">{r.responder.headline}</span>
							{/if}
						</span>
					</a>
					<ResponseBadge status={r.status} label={r.statusLabel} />
				</div>
				{#if r.note}<p class="text-sm whitespace-pre-line text-stone-800">“{r.note}”</p>{/if}
				<p class="text-xs text-stone-500">Gereageer op {r.at}</p>

				{#if r.canDecide}
					<div class="flex gap-2">
						<Button
							size="sm"
							onclick={() =>
								decide(acceptResponse, r.id, {
									title: `Aanvaar ${r.responder.name}?`,
									message:
										'Julle sien dan mekaar se selnommer. Dit kan nie ongedaan gemaak word nie.',
									confirmLabel: 'Aanvaar'
								})}>Aanvaar</Button
						>
						<Button
							variant="secondary"
							size="sm"
							onclick={() =>
								decide(declineResponse, r.id, {
									title: `Wys ${r.responder.name} af?`,
									confirmLabel: 'Wys af',
									danger: true
								})}>Wys af</Button
						>
					</div>
				{/if}
				{#if r.status === 'ACCEPTED'}
					<ContactCard name={r.responder.name} contact={r.contact} />
				{/if}
			</li>
		{/each}
	</ul>
	{#if error}<p class="text-sm text-red-700">{error}</p>{/if}
</section>
