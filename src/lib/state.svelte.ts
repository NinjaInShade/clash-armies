import type { SvelteComponent } from "svelte";

export type SvelteComponentGeneric = typeof SvelteComponent<Record<string, unknown>>;

export type Modal = {
    id: number;
    component: SvelteComponentGeneric;
    props?: Record<string, unknown>;
}

export type AppState = {
    modals: Modal[];
    townHallLevels: number[];
    townHall: number | null;
}

export function createAppState(initial: AppState) {
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
