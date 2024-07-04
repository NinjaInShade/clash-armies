import type { AppState, Modal } from '~/lib/shared/types';

export function requireHTML() {
	const html = document.querySelector('html');
	if (!html) {
		throw new Error('Expected HTML tag');
	}
	return html;
}

export function createAppState(initial: Omit<AppState, 'openModal'>) {
	const units = $state<AppState['units']>(initial.units);
	const townHalls = $state<AppState['townHalls']>(initial.townHalls);
	const user = $state<AppState['user']>(initial.user);
	let modals = $state<AppState['modals']>([]);

	return {
		get townHalls() {
			return townHalls;
		},
		get units() {
			return units;
		},
		get modals() {
			return modals;
		},
		get user() {
			return user;
		},
		openModal(component: Modal['component'], props: Modal['props'] = {}) {
			// should be fine in practice
			const id = Date.now();
			const modalSpec: Modal = {
				id,
				component,
				props: {
					...props,
					close: () => {
						modals = modals.filter((m) => m.id !== id);
						if (modals.length === 0) {
							requireHTML().classList.remove('hide-overflow');
						}
					}
				}
			};
			modals.push(modalSpec);
			requireHTML().classList.add('hide-overflow');
		},
	};
}
