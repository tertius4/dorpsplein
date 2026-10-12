<script lang="ts">
	import Badge from '#lib/components/Badge.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import Card from '#lib/components/Card.svelte';
	import Button from '#lib/components/Button.svelte';
	import { getMyListings } from '#lib/remote/listings.remote.ts';

	const listings = $derived(await getMyListings());
	const open = $derived(listings.filter((l) => l.isOpen));
	const closed = $derived(listings.filter((l) => !l.isOpen));
</script>

<svelte:head>
	<title>My plasings · Dorpsplein</title>
</svelte:head>

{#snippet row(l: (typeof listings)[number])}
	<li>
		<Card href="/plasings/{l.id}">
			<span class="flex items-start justify-between gap-3">
				<span class="font-semibold text-stone-900">{l.title}</span>
				<Badge tone={l.isOpen ? 'green' : 'neutral'}>
					{l.statusLabel}
				</Badge>
			</span>
			<span class="mt-1 block text-sm text-stone-600">
				{l.icon}
				{l.category}{l.jobType ? ` · ${l.jobType}` : ''}{l.when ? ` · ${l.when}` : ''}
			</span>
			<span class="block text-xs text-stone-500">Geplaas op {l.createdAt}</span>
		</Card>
	</li>
{/snippet}

<main class="mx-auto max-w-lg space-y-8 px-4 py-10">
	<header class="flex items-center justify-between gap-4">
		<h1 class="text-2xl font-bold text-stone-900">My plasings</h1>
		<Button size="sm" href="/plasings/nuut">Plaas werk</Button>
	</header>

	{#if listings.length === 0}
		<EmptyState title="Jy het nog niks geplaas nie">
			<p class="mt-1 text-sm text-stone-600">
				Plaas werk, dan weet mense wat by jou aanbod pas daarvan.
			</p>
			<Button size="sm" class="mt-4" href="/plasings/nuut">Plaas jou eerste werk</Button>
		</EmptyState>
	{/if}

	{#if open.length}
		<section>
			<h2 class="mb-2 font-semibold text-stone-800">Oop ({open.length})</h2>
			<ul class="space-y-2">
				{#each open as l (l.id)}{@render row(l)}{/each}
			</ul>
		</section>
	{/if}

	{#if closed.length}
		<section>
			<h2 class="mb-2 font-semibold text-stone-800">Afgehandel</h2>
			<ul class="space-y-2">
				{#each closed as l (l.id)}{@render row(l)}{/each}
			</ul>
		</section>
	{/if}
</main>
