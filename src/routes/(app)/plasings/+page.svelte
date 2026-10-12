<script lang="ts">
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
		<a
			href="/plasings/{l.id}"
			class="block rounded-lg border border-stone-200 bg-white p-4 hover:border-stone-400"
		>
			<span class="flex items-start justify-between gap-3">
				<span class="font-semibold text-stone-900">{l.title}</span>
				<span
					class="shrink-0 rounded-full px-2 py-0.5 text-xs {l.isOpen
						? 'bg-green-100 text-green-900'
						: 'bg-stone-100 text-stone-600'}"
				>
					{l.statusLabel}
				</span>
			</span>
			<span class="mt-1 block text-sm text-stone-600">
				{l.icon}
				{l.category}{l.jobType ? ` · ${l.jobType}` : ''}{l.when ? ` · ${l.when}` : ''}
			</span>
			<span class="block text-xs text-stone-500">Geplaas op {l.createdAt}</span>
		</a>
	</li>
{/snippet}

<main class="mx-auto max-w-lg space-y-8 px-4 py-10">
	<header class="flex items-center justify-between gap-4">
		<h1 class="text-2xl font-bold text-stone-900">My plasings</h1>
		<a
			href="/plasings/nuut"
			class="rounded-md bg-stone-900 px-3 py-2 text-sm font-medium text-white">Plaas werk</a
		>
	</header>

	{#if listings.length === 0}
		<section class="rounded-lg border border-dashed border-stone-300 p-6 text-center">
			<p class="font-semibold text-stone-900">Jy het nog niks geplaas nie</p>
			<p class="mt-1 text-sm text-stone-600">
				Plaas werk, dan weet mense wat by jou aanbod pas daarvan.
			</p>
			<a
				href="/plasings/nuut"
				class="mt-4 inline-block rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white"
			>
				Plaas jou eerste werk
			</a>
		</section>
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
