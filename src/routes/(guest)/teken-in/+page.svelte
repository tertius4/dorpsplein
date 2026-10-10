<script lang="ts">
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
		<p class="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
			Aanmelding met Google het nie geslaag nie. Probeer weer, of gebruik jou e-pos.
		</p>
	{/if}

	{#if passwordReset}
		<p class="mt-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
			Jou wagwoord is verander. Teken in met jou nuwe wagwoord.
		</p>
	{/if}

	<form {...signIn} class="mt-6 space-y-4">
		<label class="block">
			<span class="text-sm font-medium text-stone-700">E-pos</span>
			<input
				{...signIn.fields.email.as('email')}
				autocomplete="email"
				required
				class="mt-1 block w-full rounded-md border-stone-300"
			/>
			{#each signIn.fields.email.issues() ?? [] as issue (issue.message)}
				<span class="text-sm text-red-700">{issue.message}</span>
			{/each}
		</label>

		<label class="block">
			<span class="text-sm font-medium text-stone-700">Wagwoord</span>
			<input
				{...signIn.fields._password.as('password')}
				autocomplete="current-password"
				required
				class="mt-1 block w-full rounded-md border-stone-300"
			/>
			{#each signIn.fields._password.issues() ?? [] as issue (issue.message)}
				<span class="text-sm text-red-700">{issue.message}</span>
			{/each}

			<a href="/wagwoord-vergeet" class="mt-1 inline-block text-sm text-stone-600 underline">
				Wagwoord vergeet?
			</a>
		</label>

		{#each signIn.fields.issues() ?? [] as issue (issue.message)}
			<p class="text-sm text-red-700">{issue.message}</p>
		{/each}

		<button
			disabled={signIn.pending > 0}
			class="w-full rounded-md bg-stone-900 px-4 py-2 font-medium text-white disabled:opacity-50"
		>
			Teken in
		</button>

		<input {...signIn.fields.redirect_to.as('hidden', page.url.searchParams.get('na') ?? '')} />
	</form>

	<div class="my-6 flex items-center gap-3 text-sm text-stone-500">
		<span class="h-px flex-1 bg-stone-200"></span>of<span class="h-px flex-1 bg-stone-200"></span>
	</div>

	<form {...signInWithGoogle}>
		<input
			{...signInWithGoogle.fields.redirect_to.as('hidden', page.url.searchParams.get('na') ?? '')}
		/>
		<button
			class="w-full rounded-md border border-stone-300 bg-white px-4 py-2 font-medium text-stone-800"
		>
			Gaan voort met Google
		</button>
	</form>

	<p class="mt-6 text-sm text-stone-600">
		Het jy nog nie ’n rekening nie? <a href="/registreer" class="underline">Registreer</a>
	</p>
</main>
