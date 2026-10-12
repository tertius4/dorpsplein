<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		/** Roep as die modal toe is, hoe ook al (Esc, buite-klik, of `close()` uit die inhoud). */
		onclose: () => void;
		/** Die inhoud; kry `close` om die modal self toe te maak. */
		children: Snippet<[close: () => void]>;
	}

	const { title, onclose, children }: Props = $props();

	let dialog = $state<HTMLDialogElement>();
	const titleId = `modal-${crypto.randomUUID()}`;
	const close = () => dialog?.close();

	// Die ingeboude <dialog> hanteer fokus, Esc en die donker agtergrond.
	$effect(() => dialog?.showModal());
</script>

<dialog
	bind:this={dialog}
	aria-labelledby={titleId}
	{onclose}
	onclick={(e) => {
		// 'n Klik op die agtergrond tref die <dialog> self, nie sy inhoud nie.
		if (e.target === dialog) close();
	}}
	class="m-auto w-[calc(100%-2rem)] max-w-sm rounded-lg bg-white p-0 text-stone-900 shadow-xl backdrop:bg-stone-900/50"
>
	<div class="space-y-4 p-5">
		<h2 id={titleId} class="text-lg font-semibold">{title}</h2>
		{@render children(close)}
	</div>
</dialog>
