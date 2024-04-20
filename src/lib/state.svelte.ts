import type { SvelteComponent } from "svelte";

export type SvelteComponentGeneric = typeof SvelteComponent<Record<string, unknown>>;

export type Modal = {
    id: number;
    component: SvelteComponentGeneric;
    props?: Record<string, unknown>;
}

export type AppState = {
    modals: Modal[];
    townHall: number | null;
}

export function createAppState(initial: Partial<AppState>) {
    let modals = $state<AppState['modals']>(initial.modals ?? []);
    let townHall = $state<AppState['townHall']>(initial.townHall ?? null);

    return {
        get townHall() {
            return townHall;
        },
        set townHall(value: number | null) {
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
