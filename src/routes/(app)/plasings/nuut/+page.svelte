<script lang="ts">
	import Button from '#lib/components/Button.svelte';
	import ListingForm from '#lib/components/ListingForm.svelte';
</script>

<svelte:head>
	<title>Plaas werk · Dorpsplein</title>
</svelte:head>

<main class="mx-auto max-w-lg px-4 py-10">
	<Button variant="subtle" href="/plasings">← My plasings</Button>
	<h1 class="mt-2 mb-6 text-2xl font-bold text-stone-900">Plaas werk</h1>
	<ListingForm submitLabel="Plaas" />
</main>
