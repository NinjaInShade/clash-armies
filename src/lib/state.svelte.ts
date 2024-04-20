import type { AppState, Modal } from './types';

// TODO: see if this can be improved: the JSON file has *every* troop, even ones that aren't active right now, so we have to filter those out somehow
export const CURRENT_TROOPS = [
	'Apprentice Warden',
	'Archer',
	'Baby Dragon',
	'Balloon',
	'Barbarian',
	'Bowler',
	'Dragon Rider',
	'Dragon',
	'Electro Dragon',
	'Electro Titan',
	'Giant',
	'Goblin',
	'Golem',
	'Headhunter',
	'Healer',
	'Hog Rider',
	'Ice Golem',
	'Ice Hound',
	'Inferno Dragon',
	'Lava Hound',
	'Miner',
	'Minion',
	'P.E.K.K.A',
	'Rocket Balloon',
	'Root Rider',
	'Sneaky Goblin',
	'Super Archer',
	'Super Barbarian',
	'Super Bowler',
	'Super Dragon',
	'Super Giant',
	'Super Hog Rider',
	'Super Miner',
	'Super Minion',
	'Super Valkyrie',
	'Super Wall Breaker',
	'Super Witch',
	'Super Wizard',
	'Valkyrie',
	'Wall Breaker',
	'Witch',
	'Wizard',
	'Yeti'
] as const;

// TODO: see if this can be improved: the JSON file has *every* siege machine, even ones that aren't active right now, so we have to filter those out somehow
export const CURRENT_SIEGES = ['Wall Wrecker', 'Battle Blimp', 'Stone Slammer', 'Siege Barracks', 'Log Launcher', 'Flame Flinger', 'Battle Drill'] as const;

// TODO: see if this can be improved: the JSON file has *every* spell, even ones that aren't active right now, so we have to filter those out somehow
export const CURRENT_SPELLS = [
	'Lightning',
	'Healing',
	'Rage',
	'Jump',
	'Freeze',
	'Clone',
	'Invisibility',
	'Recall',
	'Poison',
	'Earthquake',
	'Haste',
	'Skeleton',
	'Bat'
] as const;

export function createAppState(initial: AppState) {
	const troops = $state<AppState['troops']>(initial.troops);
	const sieges = $state<AppState['sieges']>(initial.sieges);
	const spells = $state<AppState['spells']>(initial.spells);
	const townHalls = $state<AppState['townHalls']>(initial.townHalls);
	let townHall = $state<AppState['townHall']>(initial.townHall);
	let barrack = $state<AppState['barrack']>(initial.barrack);
	let darkBarrack = $state<AppState['darkBarrack']>(initial.barrack);
	let laboratory = $state<AppState['laboratory']>(initial.laboratory);
	let spellFactory = $state<AppState['spellFactory']>(initial.spellFactory);
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
					}
				}
			};
			modals.push(modalSpec);
		}
	};
}
