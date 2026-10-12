<script lang="ts">
	import Badge from './Badge.svelte';

	const { status, label }: { status: string; label: string } = $props();
</script>

<Badge tone={status === 'ACCEPTED' ? 'dark' : status === 'INTERESTED' ? 'amber' : 'neutral'}>
	{label}
</Badge>
