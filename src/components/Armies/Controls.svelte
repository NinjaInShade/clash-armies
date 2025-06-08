<script lang="ts" module>
	import type { AppState, Unit, Equipment, Pet } from '$types';

	export const SORT_OPTIONS = {
		'most-votes': 'Votes',
		'most-comments': 'Comments',
		newest: 'Date',
	};
	export type PickUnit = (Unit & { pickType: 'unit' }) | (Equipment & { pickType: 'equipment' }) | (Pet & { pickType: 'pet' });
	export type Filters = {
		hasGuide?: true;
		attackType?: string;
		noSuperTroops?: true;
		noEpicEquipment?: true;
		hasClanCastle?: boolean;
		hasEquipment?: boolean;
		hasPets?: boolean;
		units?: PickUnit[];
	};
</script>

<script lang="ts">
	import { getContext } from 'svelte';
	import type { ArmyModel } from '$models';
	import { mkParamStore } from '$client/utils';
	import { pluralize } from '$shared/utils';
	import SearchBox from './SearchBox.svelte';
	import THFilterButton from './THFilterButton.svelte';
	import SortButton from './SortButton.svelte';
	import FiltersPopup from './FiltersPopup.svelte';
	import { getTags } from '$client/army';

	type Props = {
		/** The full list of armies */
		armies: ArmyModel[];
		/** The bound list of armies that have been filtered and sorted */
		filteredArmies: ArmyModel[] | null;
		allowSearch: boolean;
		allowTHFilter: boolean;
		allowSort: (keyof typeof SORT_OPTIONS)[];
		allowFilters: boolean;
	};
	let { armies, filteredArmies = $bindable(), allowSearch, allowTHFilter, allowSort, allowFilters }: Props = $props();

	const app = getContext<AppState>('app');
	const showControls = $derived(allowSearch || allowTHFilter || allowSort.length || allowFilters);

	const search = mkParamStore('search', 'string');
	const townHall = mkParamStore('townHall', 'number');
	const sort = mkParamStore('sort', 'string');

	const hasGuide = mkParamStore('hasGuide', 'boolean');
	const attackType = mkParamStore('attackType', 'string');
	const noSuperTroops = mkParamStore('noSuperTroops', 'boolean');
	const noEpicEquipment = mkParamStore('noEpicEquipment', 'boolean');
	const hasClanCastle = mkParamStore('hasClanCastle', 'boolean');
	const hasEquipment = mkParamStore('hasEquipment', 'boolean');
	const hasPets = mkParamStore('hasPets', 'boolean');
	const units = mkParamStore<PickUnit[]>('units', 'custom', {
		// This can be improved - right now *every* unit gets a prefix,
		// but we really only need to specify prefix once and group them (e.g. u1-u2-e5 -> u1-2e5)
		serialize(value) {
			let encoded: string[] = [];
			for (const unit of value) {
				encoded.push(`${unit.pickType[0]}${unit.id}`);
			}
			return encoded.join('-');
		},
		deserialize(value) {
			if (!value) return [];
			const split = value.split('-');
			const units: PickUnit[] = [];
			for (const unit of split) {
				const pickType = unit[0];
				const id = unit.substring(1);
				let found: PickUnit | undefined;
				if (pickType === 'u') {
					const _found = app.units.find((u) => u.id === +id);
					if (_found) {
						found = { pickType: 'unit', ..._found };
					}
				} else if (pickType === 'e') {
					const _found = app.equipment.find((u) => u.id === +id);
					if (_found) {
						found = { pickType: 'equipment', ..._found };
					}
				} else if (pickType === 'p') {
					const _found = app.pets.find((u) => u.id === +id);
					if (_found) {
						found = { pickType: 'pet', ..._found };
					}
				}
				if (found) {
					units.push(found);
				}
			}
			return units;
		},
	});

	// Convenience object
	const filters = $derived({
		hasGuide: $hasGuide,
		attackType: $attackType,
		noSuperTroops: $noSuperTroops,
		noEpicEquipment: $noEpicEquipment,
		hasClanCastle: $hasClanCastle,
		hasEquipment: $hasEquipment,
		hasPets: $hasPets,
		units: $units,
	});
	const filtersLength = $derived(
		Object.values(filters).filter((v) => {
			if (Array.isArray(v)) {
				return v !== undefined && v.length;
			}
			return v !== undefined;
		}).length
	);

	$effect(() => {
		const filtered = armies.filter(filterFn);
		filtered.sort(sortFn);
		filteredArmies = filtered;
	});

	$effect(() => {
		if ($sort && !Object.keys(SORT_OPTIONS).includes($sort)) {
			$sort = undefined;
		}
	});

	function filterFn(army: ArmyModel) {
		const tags = getTags(army);
		const { units, ccUnits } = army;

		if (typeof $townHall === 'number' && army.townHall !== $townHall) {
			return false;
		}
		if ($search && !army.name?.toLowerCase().includes($search.toLowerCase())) {
			return false;
		}
		if (filters.hasGuide === true && army.guide === null) {
			return false;
		}
		if (filters.attackType !== undefined && !tags.map((t) => t.label).includes(filters.attackType)) {
			return false;
		}
		if (filters.noSuperTroops === true && units.some((u) => u.info.isSuper)) {
			return false;
		}
		if (filters.hasClanCastle !== undefined && (filters.hasClanCastle === true ? ccUnits.length < 1 : ccUnits.length > 0)) {
			return false;
		}
		if (filters.noEpicEquipment === true && army.equipment.some((eq) => eq.info.epic)) {
			return false;
		}
		if (filters.hasEquipment !== undefined && (filters.hasEquipment === true ? army.equipment.length < 1 : army.equipment.length > 0)) {
			return false;
		}
		if (filters.hasPets !== undefined && (filters.hasPets === true ? army.pets.length < 1 : army.pets.length > 0)) {
			return false;
		}
		for (const unit of filters.units ?? []) {
			let hasUnit = false;
			if (unit.pickType === 'unit') {
				hasUnit = units.find((u) => u.unitId === unit.id) !== undefined;
			} else if (unit.pickType === 'equipment') {
				hasUnit = army.equipment.find((u) => u.equipmentId === unit.id) !== undefined;
			} else if (unit.pickType === 'pet') {
				hasUnit = army.pets.find((u) => u.petId === unit.id) !== undefined;
			}
			if (!hasUnit) {
				return false;
			}
		}

		return true;
	}

	function sortFn(a: ArmyModel, b: ArmyModel) {
		if ($sort === 'most-votes') {
			return b.votes - a.votes;
		}
		if ($sort === 'most-comments') {
			return b.comments.length - a.comments.length;
		}
		if ($sort === 'newest') {
			return +b.createdTime - +a.createdTime;
		}
		return 0;
	}

	async function openFiltersPopup() {
		const newFilters = await app.openModalAsync<Filters>(FiltersPopup, { filters });
		if (newFilters === undefined) {
			return;
		}
		$hasGuide = newFilters.hasGuide;
		$attackType = newFilters.attackType;
		$noSuperTroops = newFilters.noSuperTroops;
		$noEpicEquipment = newFilters.noEpicEquipment;
		$hasClanCastle = newFilters.hasClanCastle;
		$hasEquipment = newFilters.hasEquipment;
		$hasPets = newFilters.hasPets;
		$units = newFilters.units;
	}

	export function resetAllFilters() {
		$search = undefined;
		$townHall = undefined;
		$hasGuide = undefined;
		$attackType = undefined;
		$noSuperTroops = undefined;
		$noEpicEquipment = undefined;
		$hasClanCastle = undefined;
		$hasEquipment = undefined;
		$hasPets = undefined;
		$units = [];
	}
</script>

{#if showControls}
	<div class="controls">
		<div class="left">
			{#if allowSearch}
				<div class="search-box">
					<SearchBox value={$search} onChange={(value) => ($search = value ?? undefined)} />
				</div>
			{/if}
		</div>
		<div class="right">
			{#if allowTHFilter}
				<THFilterButton value={$townHall} onChange={(value) => ($townHall = value ?? undefined)} />
			{/if}
			{#if allowSort.length}
				<SortButton value={$sort} onChange={(value) => ($sort = value ?? undefined)} />
			{/if}
			{#if allowFilters}
				<button
					class="utility-btn regular filters-btn"
					style="--bg-clr: var(--grey-850); --bg-clr-hover: var(--grey-900); --gap: 4px; --fs: 15px; --fs-weight: 500; --icon-height: 12px;"
					class:active={filtersLength > 0}
					type="button"
					onclick={openFiltersPopup}
				>
					<svg width="14" height="12" viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path
							d="M5.14196 3.53486e-07C4.61006 -0.000278488 4.09117 0.164419 3.6568 0.471394C3.22243 0.77837 2.89397 1.21251 2.71667 1.71399H0V3.42797H2.71667C2.89372 3.92977 3.22207 4.36429 3.65645 4.67165C4.09082 4.979 4.60984 5.14406 5.14196 5.14406C5.67408 5.14406 6.19309 4.979 6.62747 4.67165C7.06184 4.36429 7.39019 3.92977 7.56725 3.42797H13.7119V1.71399H7.56725C7.38995 1.21251 7.06148 0.77837 6.62711 0.471394C6.19274 0.164419 5.67385 -0.000278488 5.14196 3.53486e-07ZM4.28496 2.57098C4.28496 2.34369 4.37525 2.12571 4.53597 1.96499C4.69669 1.80428 4.91467 1.71399 5.14196 1.71399C5.36925 1.71399 5.58723 1.80428 5.74794 1.96499C5.90866 2.12571 5.99895 2.34369 5.99895 2.57098C5.99895 2.79827 5.90866 3.01625 5.74794 3.17696C5.58723 3.33768 5.36925 3.42797 5.14196 3.42797C4.91467 3.42797 4.69669 3.33768 4.53597 3.17696C4.37525 3.01625 4.28496 2.79827 4.28496 2.57098ZM8.56993 6.85594C8.03803 6.85566 7.51915 7.02036 7.08478 7.32734C6.65041 7.63431 6.32194 8.06845 6.14464 8.56993H0V10.2839H6.14464C6.3217 10.7857 6.65004 11.2202 7.08442 11.5276C7.51879 11.8349 8.03781 12 8.56993 12C9.10205 12 9.62106 11.8349 10.0554 11.5276C10.4898 11.2202 10.8182 10.7857 10.9952 10.2839H13.7119V8.56993H10.9952C10.8179 8.06845 10.4895 7.63431 10.0551 7.32734C9.62071 7.02036 9.10182 6.85566 8.56993 6.85594ZM7.71294 9.42692C7.71294 9.19963 7.80323 8.98165 7.96394 8.82094C8.12466 8.66022 8.34264 8.56993 8.56993 8.56993C8.79722 8.56993 9.0152 8.66022 9.17591 8.82094C9.33663 8.98165 9.42692 9.19963 9.42692 9.42692C9.42692 9.65421 9.33663 9.87219 9.17591 10.0329C9.0152 10.1936 8.79722 10.2839 8.56993 10.2839C8.34264 10.2839 8.12466 10.1936 7.96394 10.0329C7.80323 9.87219 7.71294 9.65421 7.71294 9.42692Z"
							fill="currentColor"
						/>
					</svg>
					{pluralize('Filter', filtersLength, 's')}
				</button>
			{/if}
		</div>
	</div>
{/if}

<style>
	.controls {
		--controls-height: 40px;

		display: flex;
		justify-content: space-between;
		width: 100%;

		&:has(.left:not(:empty) + .right:not(:empty)) {
			gap: 4px;
		}

		& .left,
		& .right {
			display: flex;
			gap: 4px;
		}

		& .left {
			flex: 1 0 0px;
		}

		& .search-box {
			max-width: 275px;
			width: 100%;

			@media (max-width: 600px) {
				max-width: none;
			}
		}

		& .filters-btn {
			text-transform: none;
			color: var(--grey-400);
			/* width: var(--controls-height); */
			height: var(--controls-height);

			&.active {
				color: hsl(33, 52%, 58%);
			}
		}

		@media (max-width: 100px) {
			flex-flow: column;
			align-items: stretch;

			&:has(.left:not(:empty) + .right:not(:empty)) {
				gap: 8px;
			}

			& .right {
				justify-content: flex-end;
			}
		}
	}
</style>
