<script lang="ts">
	import Field from '#lib/components/Field.svelte';
	import { inputClass } from '#lib/styles.ts';
	import Button from '#lib/components/Button.svelte';
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
			<Button variant="link" href="/wagwoord-vergeet">Vra ’n nuwe een aan</Button>.
		</p>
	{:else}
		<form {...resetPassword} class="mt-6 space-y-4">
			<input {...resetPassword.fields.token.as('hidden', token)} />

			<Field label="Nuwe wagwoord" issues={resetPassword.fields._password.issues() ?? []}
				><input
					{...resetPassword.fields._password.as('password')}
					autocomplete="new-password"
					required
					class={inputClass}
				/></Field
			>

			<Field label="Herhaal wagwoord" issues={resetPassword.fields._confirm.issues() ?? []}
				><input
					{...resetPassword.fields._confirm.as('password')}
					autocomplete="new-password"
					required
					class={inputClass}
				/></Field
			>

			{#each resetPassword.fields.issues() ?? [] as issue (issue.message)}
				<p class="text-sm text-red-700">{issue.message}</p>
			{/each}

			<Button block type="submit" disabled={resetPassword.pending > 0}>Stoor wagwoord</Button>
		</form>
	{/if}
</main>
