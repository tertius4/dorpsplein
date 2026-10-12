<script lang="ts">
	import EmptyState from '#lib/components/EmptyState.svelte';
	import Button from '#lib/components/Button.svelte';
	import { confirmAction } from '#lib/client/confirm.ts';
	import Avatar from '#lib/components/Avatar.svelte';
	import ContactCard from '#lib/components/ContactCard.svelte';
	import ResponseBadge from '#lib/components/ResponseBadge.svelte';
	import { getMyResponses, withdraw } from '#lib/remote/responses.remote.ts';

	const responses = $derived(await getMyResponses());
	const groups = $derived([
		{ title: 'Aanvaar', items: responses.filter((r) => r.status === 'ACCEPTED') },
		{ title: 'Wag vir ’n antwoord', items: responses.filter((r) => r.status === 'INTERESTED') },
		{
			title: 'Afgewys of onttrek',
			items: responses.filter((r) => r.status === 'DECLINED' || r.status === 'WITHDRAWN')
		}
	]);
	let error = $state('');

	async function takeBack(id: string) {
		const ok = await confirmAction({
			title: 'Onttrek jou reaksie?',
			message: 'Die plaser sal nie meer jou reaksie sien nie.',
			confirmLabel: 'Onttrek',
			danger: true
		});
		if (!ok) return;
		error = '';
		try {
			await withdraw({ id, requestId: crypto.randomUUID() });
		} catch (e) {
			error = (e as { body?: { message?: string } }).body?.message ?? 'Iets het skeefgeloop';
		}
	}
</script>

<svelte:head>
	<title>My reaksies · Dorpsplein</title>
</svelte:head>

<main class="mx-auto max-w-lg space-y-8 px-4 py-10">
	<header class="flex items-center justify-between gap-4">
		<h1 class="text-2xl font-bold text-stone-900">My reaksies</h1>
		<Button variant="subtle" href="/geleenthede">← Geleenthede</Button>
	</header>

	{#if responses.length === 0}
		<EmptyState title="Jy het nog nie gereageer nie">
			<Button size="sm" class="mt-4" href="/geleenthede">Kyk na geleenthede</Button>
		</EmptyState>
	{/if}

	{#each groups as group (group.title)}
		{#if group.items.length}
			<section>
				<h2 class="mb-2 font-semibold text-stone-800">{group.title} ({group.items.length})</h2>
				<ul class="space-y-2">
					{#each group.items as r (r.id)}
						<li class="space-y-3 rounded-lg border border-stone-200 bg-white p-4">
							<div class="flex items-start justify-between gap-3">
								<Button
									variant="link"
									class="font-semibold text-stone-900"
									href="/geleenthede/{r.listing.id}"
								>
									{r.listing.title}
								</Button>
								<ResponseBadge status={r.status} label={r.statusLabel} />
							</div>
							<p class="text-sm text-stone-600">
								{r.listing.icon}
								{r.listing.category}{r.listing.jobType ? ` · ${r.listing.jobType}` : ''}
							</p>
							<p class="flex items-center gap-2 text-xs text-stone-500">
								<Avatar name={r.listing.owner.name} image={r.listing.owner.image} size={20} />
								{r.listing.owner.name} · Gereageer op {r.at}
							</p>
							{#if r.note}<p class="text-sm text-stone-800">“{r.note}”</p>{/if}
							{#if r.status === 'ACCEPTED'}
								<ContactCard name={r.listing.owner.name} contact={r.contact} />
							{/if}
							{#if r.canWithdraw}
								<Button variant="secondary" size="sm" onclick={() => takeBack(r.id)}>Onttrek</Button
								>
							{/if}
						</li>
					{/each}
				</ul>
			</section>
		{/if}
	{/each}
	{#if error}<p class="text-sm text-red-700">{error}</p>{/if}
</main>
