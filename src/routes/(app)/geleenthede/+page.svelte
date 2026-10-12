<script lang="ts">
	import Badge from '#lib/components/Badge.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import Card from '#lib/components/Card.svelte';
	import Button from '#lib/components/Button.svelte';
	import Avatar from '#lib/components/Avatar.svelte';
	import { getOpportunities } from '#lib/remote/opportunities.remote.ts';

	const items = $derived(await getOpportunities());
	const matching = $derived(items.filter((i) => i.matches));
	const others = $derived(items.filter((i) => !i.matches));
</script>

<svelte:head>
	<title>Geleenthede · Dorpsplein</title>
</svelte:head>

{#snippet row(l: (typeof items)[number])}
	<li>
		<Card href="/geleenthede/{l.id}">
			<span class="flex items-start justify-between gap-3">
				<span class="font-semibold text-stone-900">{l.title}</span>
				{#if l.matches}
					<Badge tone="dark">Pas by jou</Badge>
				{/if}
			</span>
			<span class="mt-1 block text-sm text-stone-600">
				{l.icon}
				{l.category} · {l.jobType}{l.location ? ` · ${l.location}` : ''}{l.when
					? ` · ${l.when}`
					: ''}
			</span>
			{#if l.price}<span class="block text-sm text-stone-700">{l.price}</span>{/if}
			<span class="mt-2 flex items-center gap-2 text-xs text-stone-500">
				<Avatar name={l.owner.name} image={l.owner.image} size={20} />
				{l.owner.name}{l.closesAt ? ` · Reageer voor ${l.closesAt}` : ''}
			</span>
		</Card>
	</li>
{/snippet}

<main class="mx-auto max-w-lg space-y-8 px-4 py-10">
	<header class="flex items-center justify-between gap-4">
		<h1 class="text-2xl font-bold text-stone-900">Geleenthede</h1>
		<Button variant="subtle" href="/my-reaksies">My reaksies</Button>
	</header>

	{#if items.length === 0}
		<EmptyState title="Daar is nou geen oop plasings nie">
			<p class="mt-1 text-sm text-stone-600">
				Kies jou belangstellings, dan sê ons jou as iets pas.
			</p>
			<Button variant="secondary" size="sm" class="mt-4" href="/profiel#belangstellings">
				Kies belangstellings
			</Button>
		</EmptyState>
	{/if}

	{#if matching.length}
		<section>
			<h2 class="mb-2 font-semibold text-stone-800">Pas by jou ({matching.length})</h2>
			<ul class="space-y-2">
				{#each matching as l (l.id)}{@render row(l)}{/each}
			</ul>
		</section>
	{/if}

	{#if others.length}
		<section>
			<h2 class="mb-2 font-semibold text-stone-800">
				{matching.length ? 'Ander plasings' : 'Oop plasings'}
			</h2>
			<ul class="space-y-2">
				{#each others as l (l.id)}{@render row(l)}{/each}
			</ul>
		</section>
	{/if}
</main>
