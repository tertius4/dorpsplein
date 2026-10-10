<script lang="ts">
	import { getInitials } from '#lib';

	interface Props {
		name: string;
		image?: string | null;
		size?: number;
	}

	const { name, image = null, size = 64 }: Props = $props();

	const initials = $derived(getInitials(name));

	// Dieselfde naam kry altyd dieselfde kleur.
	const COLOURS = ['bg-amber-600', 'bg-indigo-700', 'bg-sky-700', 'bg-rose-700', 'bg-violet-700'];
	const colour = $derived(
		COLOURS[[...name].reduce((sum, c) => sum + c.charCodeAt(0), 0) % COLOURS.length]
	);
</script>

{#if image}
	<img
		src={image}
		alt=""
		width={size}
		height={size}
		referrerpolicy="no-referrer"
		class="rounded-full object-cover"
		style:width="{size}px"
		style:height="{size}px"
	/>
{:else}
	<span
		aria-hidden="true"
		class="inline-flex items-center justify-center rounded-full font-semibold text-white {colour}"
		style:width="{size}px"
		style:height="{size}px"
		style:font-size="{size * 0.4}px"
	>
		{initials}
	</span>
{/if}
