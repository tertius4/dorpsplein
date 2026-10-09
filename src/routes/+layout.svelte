<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import { getCurrentUser, signOut } from '#lib/remote/auth.remote.ts';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
	const user = $derived(await getCurrentUser());
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<header class="border-b border-stone-200 bg-white">
	<div class="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
		<a href="/" class="font-semibold text-stone-900">Dorpsplein</a>
		{#if user}
			<form {...signOut} class="flex items-center gap-3 text-sm">
				<span class="text-stone-600">{user.name}</span>
				<button class="underline">Teken uit</button>
			</form>
		{:else}
			<a href="/teken-in" class="text-sm underline">Teken in</a>
		{/if}
	</div>
</header>

{@render children()}
