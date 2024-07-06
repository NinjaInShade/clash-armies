import type { AppState, Modal, Notification } from '~/lib/shared/types';

const TOAST_DEFAULT_DURATION = 1000;

export function requireHTML() {
	const html = document.querySelector('html');
	if (!html) {
		throw new Error('Expected HTML tag');
	}
	return html;
}

export function createAppState(initial: Omit<AppState, 'modals' | 'notifications' | 'openModal' | 'notify'>) {
	const units = $state<AppState['units']>(initial.units);
	const townHalls = $state<AppState['townHalls']>(initial.townHalls);
	const user = $state<AppState['user']>(initial.user);
	let modals = $state<AppState['modals']>([]);
	let notifications = $state<AppState['notifications']>([]);

	return {
		get townHalls() {
			return townHalls;
		},
		get units() {
			return units;
		},
		get user() {
			return user;
		},
		get modals() {
			return modals;
		},
		get notifications() {
			return notifications;
		},
		openModal(component: Modal['component'], props: Modal['props'] = {}) {
			// Should be fine in practice
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
		notify(opts: Notification['opts']) {
			// eslint-disable-next-line prefer-const
			let timeout: ReturnType<typeof setTimeout> | undefined;
			// Should be fine in practice
			const id = Date.now();
			const notificationSpec: Notification = {
				id,
				opts,
				dismiss() {
					notifications = notifications.filter((n) => n.id !== id);
					clearTimeout(timeout);
				}
			}
			notifications.push(notificationSpec);
			timeout = setTimeout(() => {
				notificationSpec.dismiss();
			}, opts.duration ?? TOAST_DEFAULT_DURATION)
		}
	};
}
