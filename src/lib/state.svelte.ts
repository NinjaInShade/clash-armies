import type { AppState, Modal } from './types';

export function requireHTML() {
	const html = document.querySelector('html');
	if (!html) {
		throw new Error('Expected HTML tag');
	}
	return html;
}

export function createAppState(initial: Omit<AppState, 'openModal'>) {
	const troops = $state<AppState['troops']>(initial.troops);
	const sieges = $state<AppState['sieges']>(initial.sieges);
	const spells = $state<AppState['spells']>(initial.spells);
	const townHalls = $state<AppState['townHalls']>(initial.townHalls);
	let townHall = $state<AppState['townHall']>(initial.townHall);
	let barrack = $state<AppState['barrack']>(initial.barrack);
	let darkBarrack = $state<AppState['darkBarrack']>(initial.barrack);
	let laboratory = $state<AppState['laboratory']>(initial.laboratory);
	let spellFactory = $state<AppState['spellFactory']>(initial.spellFactory);
	let darkSpellFactory = $state<AppState['darkSpellFactory']>(initial.darkSpellFactory);
	let workshop = $state<AppState['workshop']>(initial.workshop);
	let modals = $state<AppState['modals']>([]);

	return {
		get townHalls() {
			return townHalls;
		},
		get townHall() {
			return townHall;
		},
		set townHall(value: number | null) {
			if (typeof value === 'number' && (value < 1 || value > townHalls.length)) {
				throw new Error(`Town hall ${value} doesn't exist`);
			}
			const thData = townHalls.find((th) => th.level === value);
			if (!thData) {
				throw new Error('Expected data');
			}
			townHall = value;
			barrack = thData.maxBarracks;
			darkBarrack = thData.maxDarkBarracks;
			laboratory = thData.maxLaboratory;
			spellFactory = thData.maxSpellFactory;
			darkSpellFactory = thData.maxDarkSpellFactory;
			workshop = thData.maxWorkshop;
		},
		get barrack() {
			return barrack;
		},
		get darkBarrack() {
			return darkBarrack;
		},
		get laboratory() {
			return laboratory;
		},
		get spellFactory() {
			return spellFactory;
		},
		get darkSpellFactory() {
			return darkSpellFactory;
		},
		get workshop() {
			return workshop;
		},
		get troops() {
			return troops;
		},
		get sieges() {
			return sieges;
		},
		get spells() {
			return spells;
		},
		get modals() {
			return modals;
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
		}
	};
}
