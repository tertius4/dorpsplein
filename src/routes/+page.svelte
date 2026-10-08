<script lang="ts">
	import { getCategories } from '#lib/remote/categories.remote.ts';
</script>

<svelte:head>
	<title>Dorpsplein</title>
</svelte:head>

<main class="mx-auto max-w-2xl px-4 py-12">
	<h1 class="text-3xl font-bold text-stone-900">Dorpsplein - Dev</h1>
	<p class="mt-2 text-lg text-stone-600">Waar Orania handel dryf.</p>

	<section class="mt-10">
		<h2 class="text-xl font-semibold text-stone-800">Werk-kategorieë</h2>
		<svelte:boundary>
			<ul class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
				{#each await getCategories('JOB') as category (category.id)}
					<li class="rounded-lg border border-stone-200 bg-white px-4 py-3 text-stone-800">
						{#if category.icon}<span aria-hidden="true">{category.icon}</span>{/if}
						{category.name}
					</li>
				{:else}
					<li class="col-span-full text-stone-500">Nog geen kategorieë nie.</li>
				{/each}
			</ul>

			{#snippet failed()}
				<p class="mt-4 text-red-700">Kon nie die kategorieë laai nie. Probeer later weer.</p>
			{/snippet}
		</svelte:boundary>
	</section>
</main>
