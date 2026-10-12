<script lang="ts">
	import ListingView from '#lib/components/ListingView.svelte';
	import type { PageProps } from './$types';

	let { params }: PageProps = $props();
</script>

<ListingView id={params.id} />
