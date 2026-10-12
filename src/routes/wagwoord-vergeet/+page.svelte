<script lang="ts">
	import Field from '#lib/components/Field.svelte';
	import { inputClass } from '#lib/styles.ts';
	import Button from '#lib/components/Button.svelte';
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
			<Button variant="link" href="/teken-in">Terug na teken in</Button>
		</p>
	{:else}
		<p class="mt-4 text-stone-700">
			Vul jou e-pos in, en ons stuur ’n skakel om ’n nuwe wagwoord te kies.
		</p>

		<form {...forgotPassword} class="mt-6 space-y-4">
			<Field label="E-pos" issues={forgotPassword.fields.email.issues() ?? []}
				><input
					{...forgotPassword.fields.email.as('email')}
					autocomplete="email"
					required
					class={inputClass}
				/></Field
			>

			{#each forgotPassword.fields.issues() ?? [] as issue (issue.message)}
				<p class="text-sm text-red-700">{issue.message}</p>
			{/each}

			<Button block type="submit" disabled={forgotPassword.pending > 0}>Stuur skakel</Button>
		</form>

		<p class="mt-6 text-sm text-stone-600">
			Onthou jy dit tog? <Button variant="link" href="/teken-in">Teken in</Button>
		</p>
	{/if}
</main>
