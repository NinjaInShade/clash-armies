import type { AppState, Modal, ToastNotification } from '$types';
import { HTTPApi } from '$shared/http';
import { goto } from '$app/navigation';
import C from '$components';

const TOAST_DEFAULT_DURATION = 2500;

export function requireHTML() {
	const html = document.querySelector('html');
	if (!html) {
		throw new Error('Expected HTML tag');
	}
	return html;
}

export function createAppState(initial: Pick<AppState, 'units' | 'townHalls' | 'equipment' | 'pets' | 'user'>) {
	const http = new HTTPApi();

	let units = $state<AppState['units']>(initial.units);
	let townHalls = $state<AppState['townHalls']>(initial.townHalls);
	let equipment = $state<AppState['equipment']>(initial.equipment);
	let pets = $state<AppState['pets']>(initial.pets);
	let user = $state<AppState['user']>(initial.user);
	let modals = $state<AppState['modals']>([]);
	let notifications = $state<AppState['notifications']>([]);

	return {
		http,
		get townHalls() {
			return townHalls;
		},
		set townHalls(newTownHalls: AppState['townHalls']) {
			townHalls = newTownHalls;
		},
		get units() {
			return units;
		},
		set units(newUnits: AppState['units']) {
			units = newUnits;
		},
		get equipment() {
			return equipment;
		},
		set equipment(newEquipment: AppState['equipment']) {
			equipment = newEquipment;
		},
		get pets() {
			return pets;
		},
		set pets(newPets: AppState['pets']) {
			pets = newPets;
		},
		get user() {
			return user;
		},
		set user(newUser: AppState['user']) {
			user = newUser;
		},
		get modals() {
			return modals;
		},
		get notifications() {
			return notifications;
		},
		openModal<T = unknown>(component: Modal['component'], props: Record<string, unknown> = {}, onClose?: (rtnValue?: T) => void) {
			// Should be fine in practice
			const id = Date.now();
			const modalSpec: Modal = {
				id,
				component,
				props: {
					...props,
					close: (rtnValue?: T) => {
						modals = modals.filter((m) => m.id !== id);
						if (modals.length === 0) {
							requireHTML().classList.remove('hide-overflow');
						}
						if (onClose) {
							onClose(rtnValue);
						}
					},
				},
			};
			modals.push(modalSpec);
			requireHTML().classList.add('hide-overflow');
		},
		openModalAsync<T>(component: Modal['component'], props: Record<string, unknown> = {}): Promise<T | undefined> {
			let _resolve: ((value: T | undefined) => void) | undefined;
			const promise = new Promise<T | undefined>((resolve) => (_resolve = resolve));
			this.openModal<T>(component, props, _resolve);
			return promise;
		},
		notify(opts: ToastNotification['opts']) {
			let timeout: ReturnType<typeof setTimeout> | undefined;
			// Should be fine in practice
			const id = Date.now();
			const notificationSpec: ToastNotification = {
				id,
				opts,
				dismiss() {
					notifications = notifications.filter((n) => n.id !== id);
					clearTimeout(timeout);
				},
			};
			notifications.push(notificationSpec);
			timeout = setTimeout(() => {
				notificationSpec.dismiss();
			}, opts.duration ?? TOAST_DEFAULT_DURATION);
		},
		async confirm(confirmText: string) {
			const confirmed = await this.openModalAsync<boolean>(C.Confirm, { confirmText });
			return Boolean(confirmed);
		},
		async requireAuth() {
			const loc = window.location;

			const redirectURL = new URL(`${loc.pathname}${loc.search}`, loc.origin);
			redirectURL.searchParams.set('scrollTop', window.scrollY.toString());

			const encodedRedirect = encodeURIComponent(`${redirectURL.pathname}${redirectURL.search}`);
			const authURL = new URL(`/api/login/google?r=${encodedRedirect}`, loc.origin);
			await goto(authURL);
		},
	};
}
