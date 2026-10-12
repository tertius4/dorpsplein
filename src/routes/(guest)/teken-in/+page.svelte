<script lang="ts">
	import Field from '#lib/components/Field.svelte';
	import Alert from '#lib/components/Alert.svelte';
	import { inputClass } from '#lib/styles.ts';
	import Button from '#lib/components/Button.svelte';
	import { signIn, signInWithGoogle } from '#lib/remote/auth.remote.ts';
	import { page } from '$app/state';

	const passwordReset = $derived(page.url.searchParams.get('herstel') === 'klaar');
</script>

<svelte:head>
	<title>Teken in · Dorpsplein</title>
</svelte:head>

<main class="mx-auto max-w-sm px-4 py-12">
	<h1 class="text-2xl font-bold text-stone-900">Teken in</h1>

	{#if page.url.searchParams.get('error')}
		<Alert tone="error" class="mt-4">
			Aanmelding met Google het nie geslaag nie. Probeer weer, of gebruik jou e-pos.
		</Alert>
	{/if}

	{#if passwordReset}
		<Alert tone="success" class="mt-4">
			Jou wagwoord is verander. Teken in met jou nuwe wagwoord.
		</Alert>
	{/if}

	<form {...signIn} class="mt-6 space-y-4">
		<Field label="E-pos" issues={signIn.fields.email.issues() ?? []}
			><input
				{...signIn.fields.email.as('email')}
				autocomplete="email"
				required
				class={inputClass}
			/></Field
		>

		<Field label="Wagwoord" issues={signIn.fields._password.issues() ?? []}>
			<input
				{...signIn.fields._password.as('password')}
				autocomplete="current-password"
				required
				class={inputClass}
			/>
			<Button variant="subtle" class="mt-1" href="/wagwoord-vergeet">Wagwoord vergeet?</Button>
		</Field>

		{#each signIn.fields.issues() ?? [] as issue (issue.message)}
			<p class="text-sm text-red-700">{issue.message}</p>
		{/each}

		<Button block type="submit" disabled={signIn.pending > 0}>Teken in</Button>

		<input {...signIn.fields.redirect_to.as('hidden', page.url.searchParams.get('na') ?? '')} />
	</form>

	<div class="my-6 flex items-center gap-3 text-sm text-stone-500">
		<span class="h-px flex-1 bg-stone-200"></span>of<span class="h-px flex-1 bg-stone-200"></span>
	</div>

	<form {...signInWithGoogle}>
		<input
			{...signInWithGoogle.fields.redirect_to.as('hidden', page.url.searchParams.get('na') ?? '')}
		/>
		<Button variant="secondary" block type="submit">Gaan voort met Google</Button>
	</form>

	<p class="mt-6 text-sm text-stone-600">
		Het jy nog nie ’n rekening nie? <Button variant="link" href="/registreer">Registreer</Button>
	</p>
</main>
