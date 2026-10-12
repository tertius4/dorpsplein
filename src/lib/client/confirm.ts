import { mount, unmount, type ComponentProps } from 'svelte';
import ConfirmModal from '#lib/components/ConfirmModal.svelte';

export type ConfirmOptions = Omit<ComponentProps<typeof ConfirmModal>, 'onresult'>;

/**
 * Vra die gebruiker om te bevestig, in plaas van `confirm()`. Die modal word gemount wanneer
 * dit nodig is en unmount sodra dit toe is. `true` as bevestig; `false` vir kanselleer, Esc of buite-klik.
 */
export function confirmAction(options: ConfirmOptions) {
	return new Promise<boolean>((resolve) => {
		const modal = mount(ConfirmModal, {
			target: document.body,
			props: {
				...options,
				onresult: (confirmed) => {
					resolve(confirmed);
					void unmount(modal);
				}
			}
		});
	});
}
