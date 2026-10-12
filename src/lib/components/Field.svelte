<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		label: string;
		/** Foute van die veld, bv. `form.fields.title.issues()`. */
		issues?: { message: string }[];
		/** Klein hulpteks onder die veld. */
		hint?: string;
		children: Snippet;
	}

	/** 'n Etiket, die veld self (`children`, met `inputClass`), en sy foute. */
	const { label, issues = [], hint, children }: Props = $props();
</script>

<label class="block">
	<span class="text-sm font-medium text-stone-700">{label}</span>
	{@render children()}
	{#if hint}<span class="block text-xs text-stone-500">{hint}</span>{/if}
	{#each issues as issue (issue.message)}
		<span class="block text-sm text-red-700">{issue.message}</span>
	{/each}
</label>
