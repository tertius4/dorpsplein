<script lang="ts">
	import Button from '#lib/components/Button.svelte';
	interface Contact {
		phone: string;
		tel: string;
		whatsapp: string;
	}

	const { name, contact }: { name: string; contact: Contact | null } = $props();
</script>

<div class="rounded-md border border-stone-300 bg-stone-50 p-3 text-sm">
	<p class="font-semibold text-stone-900">Kontak {name}</p>
	{#if contact}
		<p class="mt-1 text-stone-800">{contact.phone}</p>
		<div class="mt-2 flex gap-2">
			<Button size="sm" href={contact.tel}>Bel</Button>
			<Button variant="secondary" size="sm" href={contact.whatsapp} rel="noopener">WhatsApp</Button>
		</div>
	{:else}
		<p class="mt-1 text-stone-600">
			Hierdie persoon het nog geen selnommer by sy profiel gesit nie.
		</p>
	{/if}
</div>
