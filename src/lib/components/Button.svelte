<script lang="ts">
	import type { Snippet } from 'svelte';
	import { buttonClass, type ButtonSize, type ButtonVariant } from '#lib/styles.ts';

	interface Props {
		variant?: ButtonVariant;
		size?: ButtonSize;
		/** Volle breedte. */
		block?: boolean;
		/** Gestel = 'n skakel (`<a>`) met dieselfde voorkoms. */
		href?: string;
		/** Gebruik `submit` vir 'n vorm; sonder `type` is dit 'n gewone knoppie. */
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		onclick?: (event: MouseEvent) => void;
		rel?: string;
		title?: string;
		class?: string;
		children: Snippet;
	}

	const {
		variant = 'primary',
		size = 'md',
		block = false,
		href,
		type = 'button',
		disabled,
		onclick,
		rel,
		title,
		class: className,
		children
	}: Props = $props();

	const classes = $derived([buttonClass({ variant, size, block }), className]);
</script>

{#if href !== undefined}
	<a {href} {rel} {title} {onclick} class={classes}>{@render children()}</a>
{:else}
	<button {type} {disabled} {title} {onclick} class={classes}>{@render children()}</button>
{/if}
