<script lang="ts">
	import { page } from '$app/state';
	import { resetPassword } from '#lib/remote/auth.remote.ts';

	const token = $derived(page.url.searchParams.get('token') ?? '');
	const error = $derived(page.url.searchParams.get('error'));
</script>

<svelte:head>
	<title>Nuwe wagwoord · Dorpsplein</title>
	<!-- The URL contains a secret token: never send it to another site as a Referer -->
	<meta name="referrer" content="no-referrer" />
</svelte:head>

<main class="mx-auto max-w-sm px-4 py-12">
	<h1 class="text-2xl font-bold text-stone-900">Kies ’n nuwe wagwoord</h1>

	{#if error || !token}
		<p class="mt-4 text-stone-700">
			Die skakel het verval of is ongeldig.
			<a href="/wagwoord-vergeet" class="underline">Vra ’n nuwe een aan</a>.
		</p>
	{:else}
		<form {...resetPassword} class="mt-6 space-y-4">
			<input {...resetPassword.fields.token.as('hidden', token)} />

			<label class="block">
				<span class="text-sm font-medium text-stone-700">Nuwe wagwoord</span>
				<input
					{...resetPassword.fields._password.as('password')}
					autocomplete="new-password"
					required
					class="mt-1 block w-full rounded-md border-stone-300"
				/>
				{#each resetPassword.fields._password.issues() ?? [] as issue (issue.message)}
					<span class="text-sm text-red-700">{issue.message}</span>
				{/each}
			</label>

			<label class="block">
				<span class="text-sm font-medium text-stone-700">Herhaal wagwoord</span>
				<input
					{...resetPassword.fields._confirm.as('password')}
					autocomplete="new-password"
					required
					class="mt-1 block w-full rounded-md border-stone-300"
				/>
				{#each resetPassword.fields._confirm.issues() ?? [] as issue (issue.message)}
					<span class="text-sm text-red-700">{issue.message}</span>
				{/each}
			</label>

			{#each resetPassword.fields.issues() ?? [] as issue (issue.message)}
				<p class="text-sm text-red-700">{issue.message}</p>
			{/each}

			<button
				disabled={resetPassword.pending > 0}
				class="w-full rounded-md bg-stone-900 px-4 py-2 font-medium text-white disabled:opacity-50"
			>
				Stoor wagwoord
			</button>
		</form>
	{/if}
</main>
