<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import Avatar from '#lib/components/Avatar.svelte';
	import { getCurrentUser, signOut } from '#lib/remote/auth.remote.ts';
	import { navigating, page } from '$app/state';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
	const user = $derived(await getCurrentUser());

	/** Net bladsye wat bestaan; Geleenthede, Plasings en Kennisgewings kom in Fase 2–4. */
	const NAV = [
		{ href: '/tuis', label: 'Tuis', icon: '🏠' },
		{ href: '/profiel', label: 'Profiel', icon: '👤' }
	];
	const isActive = (href: string) => page.url.pathname === href;
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if navigating.to}
	<div class="fixed inset-x-0 top-0 z-50 h-0.5 animate-pulse bg-stone-900" aria-hidden="true"></div>
{/if}

<div class="flex min-h-dvh flex-col">
	<header class="border-b border-stone-200 bg-white">
		<div class="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-3">
			<a href={user ? '/tuis' : '/'} class="font-semibold text-stone-900">Dorpsplein</a>

			{#if user}
				<nav class="hidden items-center gap-4 text-sm sm:flex" aria-label="Hoof">
					{#each NAV as item (item.href)}
						<a
							href={item.href}
							aria-current={isActive(item.href) ? 'page' : undefined}
							class={isActive(item.href) ? 'font-semibold text-stone-900' : 'text-stone-600'}
						>
							{item.label}
						</a>
					{/each}
				</nav>
				<div class="flex items-center gap-3 text-sm">
					<a href="/profiel" class="flex items-center gap-2 text-stone-700">
						<Avatar name={user.name} image={user.image} size={28} />
						<span class="hidden sm:inline">{user.name}</span>
					</a>
					<form {...signOut}>
						<button class="text-stone-600 underline">Teken uit</button>
					</form>
				</div>
			{:else}
				<div class="flex items-center gap-3 text-sm">
					<a href="/teken-in" class="text-stone-700 underline">Teken in</a>
					<a href="/registreer" class="rounded-md bg-stone-900 px-3 py-1.5 font-medium text-white">
						Registreer
					</a>
				</div>
			{/if}
		</div>
	</header>

	<div class="flex-1">
		{@render children()}
	</div>

	<footer
		class="border-t border-stone-200 py-6 text-center text-xs text-stone-500 {user
			? 'mb-14 sm:mb-0'
			: ''}"
	>
		<a href="/privaatheid" class="underline">Privaatheid</a>
		·
		<a href="/terme" class="underline">Terme</a>
		·
		<a href="mailto:privaat@dorpsplein.co.za" class="underline">Kontak</a>
	</footer>
</div>

{#if user}
	<nav
		class="fixed inset-x-0 bottom-0 z-40 flex border-t border-stone-200 bg-white sm:hidden"
		aria-label="Hoof"
	>
		{#each NAV as item (item.href)}
			<a
				href={item.href}
				aria-current={isActive(item.href) ? 'page' : undefined}
				class="flex flex-1 flex-col items-center py-2 text-xs {isActive(item.href)
					? 'font-semibold text-stone-900'
					: 'text-stone-500'}"
			>
				<span class="text-lg" aria-hidden="true">{item.icon}</span>
				{item.label}
			</a>
		{/each}
	</nav>
{/if}
