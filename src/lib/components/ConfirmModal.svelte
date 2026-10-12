<script lang="ts">
	import Button from '#lib/components/Button.svelte';
	import Modal from './Modal.svelte';

	interface Props {
		title: string;
		message?: string;
		confirmLabel?: string;
		cancelLabel?: string;
		/** Rooi knoppie vir iets wat nie ongedaan gemaak kan word nie. */
		danger?: boolean;
		/** `true` as bevestig is; `false` vir kanselleer, Esc of 'n klik daarbuite. */
		onresult: (confirmed: boolean) => void;
	}

	const {
		title,
		message,
		confirmLabel = 'Ja',
		cancelLabel = 'Kanselleer',
		danger = false,
		onresult
	}: Props = $props();

	let confirmed = false;
</script>

<Modal {title} onclose={() => onresult(confirmed)}>
	{#snippet children(close)}
		{#if message}<p class="text-sm text-stone-700">{message}</p>{/if}
		<div class="flex justify-end gap-2">
			<Button variant="secondary" size="sm" onclick={close}>
				{cancelLabel}
			</Button>
			<Button
				variant={danger ? 'destructive' : 'primary'}
				size="sm"
				onclick={() => {
					confirmed = true;
					close();
				}}
			>
				{confirmLabel}
			</Button>
		</div>
	{/snippet}
</Modal>
