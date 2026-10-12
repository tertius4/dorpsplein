<script lang="ts">
	import Field from '#lib/components/Field.svelte';
	import Alert from '#lib/components/Alert.svelte';
	import { inputClass } from '#lib/styles.ts';
	import Button from '#lib/components/Button.svelte';
	import { signInWithGoogle, signUp } from '#lib/remote/auth.remote.ts';
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>Registreer · Dorpsplein</title>
</svelte:head>

<main class="mx-auto max-w-sm px-4 py-12">
	<h1 class="text-2xl font-bold text-stone-900">Skep ’n rekening</h1>

	{#if page.url.searchParams.get('error')}
		<Alert tone="error" class="mt-4">
			Aanmelding met Google het nie geslaag nie. Probeer weer, of gebruik jou e-pos.
		</Alert>
	{/if}

	<form {...signUp} class="mt-6 space-y-4">
		<Field label="Naam en van" issues={signUp.fields.name.issues() ?? []}
			><input
				{...signUp.fields.name.as('text')}
				autocomplete="name"
				required
				class={inputClass}
			/></Field
		>

		<Field label="E-pos" issues={signUp.fields.email.issues() ?? []}
			><input
				{...signUp.fields.email.as('email')}
				autocomplete="email"
				required
				class={inputClass}
			/></Field
		>

		<Field label="Wagwoord" issues={signUp.fields._password.issues() ?? []}
			><input
				{...signUp.fields._password.as('password')}
				autocomplete="new-password"
				required
				class={inputClass}
			/></Field
		>

		{#each signUp.fields.issues() ?? [] as issue (issue.message)}
			<p class="text-sm text-red-700">{issue.message}</p>
		{/each}

		<Button block type="submit" disabled={signUp.pending > 0}>Registreer</Button>
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
		Het jy reeds ’n rekening? <Button variant="link" href="/teken-in">Meld aan</Button>
	</p>
</main>
