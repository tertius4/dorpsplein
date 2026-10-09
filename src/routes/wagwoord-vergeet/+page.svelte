<script lang="ts">
	import { forgotPassword } from '#lib/remote/auth.remote.ts';
</script>

<svelte:head>
	<title>Wagwoord vergeet · Dorpsplein</title>
</svelte:head>

<main class="mx-auto max-w-sm px-4 py-12">
	<h1 class="text-2xl font-bold text-stone-900">Wagwoord vergeet</h1>

	{#if forgotPassword.result?.sent}
		<p class="mt-4 text-stone-700">
			As daar ’n rekening met hierdie adres is, het ons ’n skakel gestuur om ’n nuwe wagwoord te
			kies. Kyk ook in jou spam-vouer. Die skakel is 1 uur geldig.
		</p>
		<p class="mt-6 text-sm text-stone-600">
			<a href="/teken-in" class="underline">Terug na teken in</a>
		</p>
	{:else}
		<p class="mt-4 text-stone-700">
			Vul jou e-pos in, en ons stuur ’n skakel om ’n nuwe wagwoord te kies.
		</p>

		<form {...forgotPassword} class="mt-6 space-y-4">
			<label class="block">
				<span class="text-sm font-medium text-stone-700">E-pos</span>
				<input
					{...forgotPassword.fields.email.as('email')}
					autocomplete="email"
					required
					class="mt-1 block w-full rounded-md border-stone-300"
				/>
				{#each forgotPassword.fields.email.issues() ?? [] as issue (issue.message)}
					<span class="text-sm text-red-700">{issue.message}</span>
				{/each}
			</label>

			{#each forgotPassword.fields.issues() ?? [] as issue (issue.message)}
				<p class="text-sm text-red-700">{issue.message}</p>
			{/each}

			<button
				disabled={forgotPassword.pending > 0}
				class="w-full rounded-md bg-stone-900 px-4 py-2 font-medium text-white disabled:opacity-50"
			>
				Stuur skakel
			</button>
		</form>

		<p class="mt-6 text-sm text-stone-600">
			Onthou jy dit tog? <a href="/teken-in" class="underline">Teken in</a>
		</p>
	{/if}
</main>
