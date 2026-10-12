<script lang="ts">
	import Badge from '#lib/components/Badge.svelte';
	import Card from '#lib/components/Card.svelte';
	import { inputClass } from '#lib/styles.ts';
	import Field from '#lib/components/Field.svelte';
	import Button from '#lib/components/Button.svelte';
	import { confirmAction, type ConfirmOptions } from '#lib/client/confirm.ts';
	import Avatar from '#lib/components/Avatar.svelte';
	import ContactCard from '#lib/components/ContactCard.svelte';
	import ListingResponses from '#lib/components/ListingResponses.svelte';
	import ResponseBadge from '#lib/components/ResponseBadge.svelte';
	import { cancelListing, completeListing, getListing } from '#lib/remote/listings.remote.ts';
	import { respond, withdraw } from '#lib/remote/responses.remote.ts';
	import { goto } from '$app/navigation';

	/** Een plasing, vir die eienaar (/plasings/[id]) én ander lede (/geleenthede/[id]). */
	const { id }: { id: string } = $props();
	const listing = $derived(await getListing(id));
	let error = $state('');

	const f = respond.fields;
	// 'n Nuwe id per poging: ná 'n onttrekking mag dieselfde persoon weer reageer.
	let requestId = $state(crypto.randomUUID());

	async function change(
		action: typeof cancelListing | typeof completeListing,
		options: ConfirmOptions
	) {
		if (!(await confirmAction(options))) return;
		error = '';
		try {
			await action({ id: listing.id, requestId: crypto.randomUUID() });
			await goto('/plasings');
		} catch (e) {
			error = (e as { body?: { message?: string } }).body?.message ?? 'Iets het skeefgeloop';
		}
	}

	async function takeBack(responseId: string) {
		const ok = await confirmAction({
			title: 'Onttrek jou reaksie?',
			message: 'Die plaser sal nie meer jou reaksie sien nie.',
			confirmLabel: 'Onttrek',
			danger: true
		});
		if (!ok) return;
		error = '';
		try {
			await withdraw({ id: responseId, requestId: crypto.randomUUID() });
		} catch (e) {
			error = (e as { body?: { message?: string } }).body?.message ?? 'Iets het skeefgeloop';
		}
	}
</script>

<svelte:head>
	<title>{listing.title} · Dorpsplein</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="mx-auto max-w-lg space-y-6 px-4 py-10">
	{#if listing.isOwner}
		<Button variant="subtle" href="/plasings">← My plasings</Button>
	{:else}
		<Button variant="subtle" href="/geleenthede">← Geleenthede</Button>
	{/if}

	<header>
		<div class="flex items-start justify-between gap-3">
			<h1 class="text-2xl font-bold text-stone-900">{listing.title}</h1>
			<Badge tone={listing.isOpen ? 'green' : 'neutral'}>{listing.statusLabel}</Badge>
		</div>
		<p class="mt-1 text-stone-600">
			{listing.icon}
			{listing.category} · {listing.jobType}
		</p>
	</header>

	<dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
		{#if listing.price}<dt class="text-stone-500">Betaling</dt>
			<dd>{listing.price}</dd>{/if}
		{#if listing.location}<dt class="text-stone-500">Plek</dt>
			<dd>{listing.location}</dd>{/if}
		<dt class="text-stone-500">Mense gesoek</dt>
		<dd>{listing.capacity} ({listing.acceptedCount} aanvaar)</dd>
		{#if listing.startsAt}<dt class="text-stone-500">Begin</dt>
			<dd>{listing.startsAt}</dd>{/if}
		{#if listing.endsAt}<dt class="text-stone-500">Einde</dt>
			<dd>{listing.endsAt}</dd>{/if}
		{#if listing.closesAt}<dt class="text-stone-500">Reageer voor</dt>
			<dd>{listing.closesAt}</dd>{/if}
	</dl>

	{#if listing.description}
		<p class="whitespace-pre-line text-stone-800">{listing.description}</p>
	{/if}

	<Card>
		<h2 class="text-sm font-semibold text-stone-500">Geplaas deur</h2>
		<a href="/mense/{listing.owner.id}" class="mt-2 flex items-center gap-3">
			<Avatar name={listing.owner.name} image={listing.owner.image} size={44} />
			<span>
				<span class="block font-semibold text-stone-900">{listing.owner.name}</span>
				{#if listing.owner.headline}
					<span class="block text-sm text-stone-600">{listing.owner.headline}</span>
				{/if}
			</span>
		</a>
		<p class="mt-2 text-xs text-stone-500">Geplaas op {listing.postedAt}</p>
	</Card>

	{#if listing.isOwner}
		{#if listing.isOpen || listing.status === 'CLOSED'}
			<section class="flex flex-wrap items-center gap-2">
				{#if listing.isOpen}
					<Button size="sm" href="/plasings/{listing.id}/wysig">Wysig</Button>
				{/if}
				<Button
					variant="secondary"
					size="sm"
					onclick={() =>
						change(completeListing, {
							title: 'Merk as voltooi?',
							message: 'Die plasing sluit en sal onder “Afgehandel” verskyn.',
							confirmLabel: 'Voltooi'
						})}>Voltooi</Button
				>
				<Button
					variant="danger"
					size="sm"
					onclick={() =>
						change(cancelListing, {
							title: 'Kanselleer hierdie plasing?',
							message: 'Dit kan nie ongedaan gemaak word nie.',
							confirmLabel: 'Kanselleer plasing',
							cancelLabel: 'Terug',
							danger: true
						})}>Kanselleer</Button
				>
			</section>
		{/if}
		<ListingResponses listingId={listing.id} />
	{:else if listing.myResponse && listing.myResponse.status !== 'WITHDRAWN'}
		{@const mine = listing.myResponse}
		<Card class="space-y-3">
			<div class="flex items-center justify-between gap-3">
				<h2 class="font-semibold text-stone-900">Jou reaksie</h2>
				<ResponseBadge status={mine.status} label={mine.statusLabel} />
			</div>
			{#if mine.note}<p class="text-sm text-stone-800">“{mine.note}”</p>{/if}
			{#if mine.status === 'INTERESTED'}
				<p class="text-sm text-stone-600">Die plaser sal jou laat weet.</p>
			{:else if mine.status === 'DECLINED'}
				<p class="text-sm text-stone-600">
					Die plaser het nie hierdie keer jou reaksie gekies nie.
				</p>
			{:else if mine.status === 'ACCEPTED'}
				<ContactCard name={listing.owner.name} contact={mine.ownerContact} />
			{/if}
			{#if mine.status === 'INTERESTED' || mine.status === 'ACCEPTED'}
				{#if listing.status === 'OPEN' || listing.status === 'CLOSED'}
					<Button variant="secondary" size="sm" onclick={() => takeBack(mine.id)}>Onttrek</Button>
				{/if}
			{/if}
		</Card>
	{:else if listing.canRespond}
		<form
			{...respond.enhance(async ({ submit }) => {
				await submit();
				if (!(f.allIssues() ?? []).length) {
					f.note.set('');
					requestId = crypto.randomUUID();
				}
			})}
			class="space-y-3 rounded-lg border border-stone-200 bg-white p-4"
		>
			<h2 class="font-semibold text-stone-900">Is jy beskikbaar?</h2>
			<input {...f.requestId.as('hidden', requestId)} />
			<input {...f.listingId.as('hidden', listing.id)} />
			<Field label="Boodskap aan die plaser (opsioneel)" issues={f.note.issues() ?? []}
				><textarea
					{...f.note.as('text')}
					rows="3"
					maxlength="300"
					placeholder="bv. Kan eers 09:00 begin"
					class={inputClass}></textarea></Field
			>
			{#each f.allIssues() ?? [] as issue (issue.message)}
				<p class="text-sm text-red-700">{issue.message}</p>
			{/each}
			<Button block type="submit" disabled={respond.pending > 0}>Ek is beskikbaar</Button>
			<p class="text-xs text-stone-500">
				Jou selnommer word eers met die plaser gedeel as hy jou aanvaar.
			</p>
		</form>
	{:else if listing.status !== 'OPEN'}
		<p class="rounded-lg bg-stone-100 px-4 py-3 text-sm text-stone-700">
			Hierdie plasing is nie meer oop vir reaksies nie.
		</p>
	{:else}
		<p class="rounded-lg bg-stone-100 px-4 py-3 text-sm text-stone-700">
			Die sperdatum vir reaksies het verby gegaan.
		</p>
	{/if}

	{#if error}<p class="text-sm text-red-700">{error}</p>{/if}
</main>
