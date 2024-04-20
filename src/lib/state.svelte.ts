import type { SvelteComponent } from "svelte";

export type SvelteComponentGeneric = typeof SvelteComponent<Record<string, unknown>>;

type Level = number;

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
export type TroopName = (typeof CURRENT_TROOPS)[number];
export type TroopData = Record<Level, {
    barrackLevel: number,
    laboratoryLevel: number;
    housingSpace: number,
    trainingTime: number; // In seconds
}>;
export type Troops = Partial<Record<TroopName, TroopData>>;

// TODO: see if this can be improved: the JSON file has *every* siege machine, even ones that aren't active right now, so we have to filter those out somehow
export const CURRENT_SIEGES = [
    'Wall Wrecker',
    'Battle Blimp',
    'Stone Slammer',
    'Siege Barracks',
    'Log Launcher',
    'Flame Flinger',
    'Battle Drill'
] as const;
export type SiegeName = (typeof CURRENT_SIEGES)[number];
export type SiegeData = Record<Level, {
    barrackLevel: number,
    laboratoryLevel: number;
    housingSpace: number,
    trainingTime: number; // In seconds
}>;
export type Sieges = Partial<Record<SiegeName, SiegeData>>;

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
export type SpellName = (typeof CURRENT_SPELLS)[number];
export type SpellData = Record<Level, {
    spellFactoryLevel: number;
    laboratoryLevel: number;
    housingSpace: number;
    trainingTime: number // In seconds
}>;
export type Spells = Partial<Record<SpellName, SpellData>>;

export type Modal = {
    id: number;
    component: SvelteComponentGeneric;
    props?: Record<string, unknown>;
}

export type AppState = {
    // frequently used data (cache)
    troops: Required<Troops>;
    sieges: Required<Sieges>;
    spells: Required<Spells>;
    townHallLevels: number[];
    // user state
    townHall: number | null;
    // general app state
    modals: Modal[];
}

export function createAppState(initial: AppState) {
    const troops = $state<AppState['troops']>(initial.troops);
    const sieges = $state<AppState['sieges']>(initial.sieges);
    const spells = $state<AppState['spells']>(initial.spells);
    const townHallLevels = $state<AppState['townHallLevels']>(initial.townHallLevels);
    let townHall = $state<AppState['townHall']>(initial.townHall);
    let modals = $state<AppState['modals']>([]);

    return {
        get townHallLevels() {
            return townHallLevels;
        },
        get townHall() {
            return townHall;
        },
        set townHall(value: number | null) {
            if (typeof value === 'number' && (value < 1 || value > townHallLevels.length)) {
                throw new Error(`Town hall ${value} doesn't exist`);
            }
            townHall = value;
        },
        get troops() {
            return troops;
        },
        get sieges() {
            return sieges;
        },
        get spells() {
            return spells
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
                        modals = modals.filter(m => m.id !== id);
                    }
                }
            };
            modals.push(modalSpec);
        }
    }
}
