import type { SvelteComponent } from 'svelte';
import { CURRENT_TROOPS, CURRENT_SIEGES, CURRENT_SPELLS } from './state.svelte';

export type SvelteComponentGeneric = typeof SvelteComponent<Record<string, unknown>>;

export type Level = number;

export type TroopName = (typeof CURRENT_TROOPS)[number];
export type TroopData = Record<
	Level,
	{
		barrackLevel: number;
		laboratoryLevel: number;
		housingSpace: number;
		trainingTime: number; // In seconds
	}
>;
export type Troops = Partial<Record<TroopName, TroopData>>;

export type SiegeName = (typeof CURRENT_SIEGES)[number];
export type SiegeData = Record<
	Level,
	{
		barrackLevel: number;
		laboratoryLevel: number;
		housingSpace: number;
		trainingTime: number; // In seconds
	}
>;
export type Sieges = Partial<Record<SiegeName, SiegeData>>;

export type SpellName = (typeof CURRENT_SPELLS)[number];
export type SpellData = Record<
	Level,
	{
		spellFactoryLevel: number;
		laboratoryLevel: number;
		housingSpace: number;
		trainingTime: number; // In seconds
	}
>;
export type Spells = Partial<Record<SpellName, SpellData>>;

export type Modal = {
	id: number;
	component: SvelteComponentGeneric;
	props?: Record<string, unknown>;
};

type TownHallData = {
	level: number;
	maxBarracks: number;
	maxDarkBarracks: number;
	maxLaboratory: number;
	maxSpellFactory: number;
};

export type AppState = {
	// frequently used data (cache)
	troops: Required<Troops>;
	sieges: Required<Sieges>;
	spells: Required<Spells>;
	townHalls: TownHallData[];
	// user state
	townHall: number | null;
	barrack: number | null;
	darkBarrack: number | null;
	laboratory: number | null;
	spellFactory: number | null;
	// general app state
	modals: Modal[];
};