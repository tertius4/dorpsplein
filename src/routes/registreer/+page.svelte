<script lang="ts">
	import { signUp } from '#lib/remote/auth.remote.ts';
</script>

<svelte:head>
	<title>Registreer · Dorpsplein</title>
</svelte:head>

<main class="mx-auto max-w-sm px-4 py-12">
	<h1 class="text-2xl font-bold text-stone-900">Skep ’n rekening</h1>

	<form {...signUp} class="mt-6 space-y-4">
		<label class="block">
			<span class="text-sm font-medium text-stone-700">Naam en van</span>
			<input
				{...signUp.fields.name.as('text')}
				autocomplete="name"
				required
				class="mt-1 block w-full rounded-md border-stone-300"
			/>
			{#each signUp.fields.name.issues() ?? [] as issue (issue.message)}
				<span class="text-sm text-red-700">{issue.message}</span>
			{/each}
		</label>

		<label class="block">
			<span class="text-sm font-medium text-stone-700">E-pos</span>
			<input
				{...signUp.fields.email.as('email')}
				autocomplete="email"
				required
				class="mt-1 block w-full rounded-md border-stone-300"
			/>
			{#each signUp.fields.email.issues() ?? [] as issue}
				<span class="text-sm text-red-700">{issue.message}</span>
			{/each}
		</label>

		<label class="block">
			<span class="text-sm font-medium text-stone-700">Wagwoord</span>
			<input
				{...signUp.fields._password.as('password')}
				autocomplete="new-password"
				required
				class="mt-1 block w-full rounded-md border-stone-300"
			/>
			{#each signUp.fields._password.issues() ?? [] as issue}
				<span class="text-sm text-red-700">{issue.message}</span>
			{/each}
		</label>

		{#each signUp.fields.issues() ?? [] as issue (issue.message)}
			<p class="text-sm text-red-700">{issue.message}</p>
		{/each}

		<button
			disabled={signUp.pending > 0}
			class="w-full rounded-md bg-stone-900 px-4 py-2 font-medium text-white disabled:opacity-50"
		>
			Registreer
		</button>
	</form>

	<p class="mt-6 text-sm text-stone-600">
		Het jy reeds ’n rekening? <a href="/teken-in" class="underline">Meld aan</a>
	</p>
</main>
