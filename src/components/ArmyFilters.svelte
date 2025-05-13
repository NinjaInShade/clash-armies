<script lang="ts" module>
	import type { AppState, Unit, Equipment, Pet } from '$types';
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
	import { getContext, untrack } from 'svelte';
	import { getTags } from '$client/army';
	import { mkParamStore } from '$client/utils';
	import type { ArmyModel } from '$models';
	import FiltersPopup from './FiltersPopup.svelte';
	import Input from './Input.svelte';
	import Menu from './Menu.svelte';

	type Props = {
		/** The full list of armies */
		armies: ArmyModel[];
		/** The bound list of armies that have been filtered and sorted */
		filteredArmies: ArmyModel[] | null;
	};

	let { armies, filteredArmies = $bindable() }: Props = $props();
	const app = getContext<AppState>('app');
	const sortOptions = ['Name', 'Votes'];

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

	let thMenuShow = $state<boolean>(false);
	let thMenuEl = $state<HTMLButtonElement>();
	let sortMenuShow = $state<boolean>(false);
	let sortMenuEl = $state<HTMLButtonElement>();

	$effect(() => {
		const filtered = armies.filter(filterFn);
		filtered.sort(sortFn);
		filteredArmies = filtered;
	});

	$effect(() => {
		if ($sort && !sortOptions.includes($sort)) {
			$sort = undefined;
		}
	});

	function filterFn(army: ArmyModel) {
		const tags = getTags(army);
		const units = army.units.filter((unit) => unit.home === 'armyCamp');
		const ccUnits = army.units.filter((unit) => unit.home === 'clanCastle');
		if (typeof $townHall === 'number' && army.townHall !== $townHall) {
			return false;
		}
		if ($search && !army.name.toLowerCase().includes($search.toLowerCase())) {
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
		if ($sort === 'Votes') {
			return b.votes - a.votes;
		}
		if ($sort === 'Name') {
			return a.name.localeCompare(b.name);
		}
		// Default sorting (newest first)
		return +b.createdTime - +a.createdTime;
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

{#snippet searchIcon()}
	<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path
			d="M10.0057 8.80503H9.37336L9.14923 8.58891C9.96079 7.64759 10.4068 6.44584 10.4059 5.20297C10.4059 4.17392 10.1008 3.16798 9.52909 2.31236C8.95738 1.45673 8.14478 0.789856 7.19407 0.396055C6.24335 0.00225437 5.1972 -0.100782 4.18792 0.099976C3.17865 0.300734 2.25157 0.796269 1.52392 1.52392C0.796269 2.25157 0.300734 3.17865 0.099976 4.18792C-0.100782 5.1972 0.00225437 6.24335 0.396055 7.19407C0.789856 8.14478 1.45673 8.95738 2.31236 9.52909C3.16798 10.1008 4.17392 10.4059 5.20297 10.4059C6.49171 10.4059 7.67639 9.93368 8.58891 9.14923L8.80503 9.37336V10.0057L12.8073 14L14 12.8073L10.0057 8.80503ZM5.20297 8.80503C3.20984 8.80503 1.60092 7.19611 1.60092 5.20297C1.60092 3.20984 3.20984 1.60092 5.20297 1.60092C7.19611 1.60092 8.80503 3.20984 8.80503 5.20297C8.80503 7.19611 7.19611 8.80503 5.20297 8.80503Z"
			fill="#8C8C8C"
		/>
	</svg>
{/snippet}

<div class="filters">
	<div class="left">
		<Input
			value={$search}
			onChange={(value) => {
				$search = value ?? undefined;
			}}
			placeholder="Search armies"
			containerClass="searchbox"
			icon={searchIcon}
			--input-width="250px"
		/>
	</div>
	<div class="filter-btns">
		<button class="th-filter filter-btn" class:active={$townHall !== undefined} type="button" bind:this={thMenuEl} onclick={() => (thMenuShow = !thMenuShow)}>
			{#if $townHall === undefined}
				<img src="/clash/town-halls/17.png" alt="Town hall 17" />
				TH
			{:else}
				<img src="/clash/town-halls/{$townHall}.png" alt="Town hall {$townHall}" />
				TH{$townHall}
			{/if}
		</button>
		<Menu bind:open={thMenuShow} elRef={thMenuEl}>
			<ul class="menu th-menu">
				{#each [...app.townHalls].reverse() as th}
					{@const isSelected = $townHall === th.level}
					<li>
						<button
							type="button"
							class="town-hall {isSelected ? 'disabled' : ''} focus-grey"
							onclick={() => {
								$townHall = $townHall === th.level ? undefined : th.level;
								thMenuShow = false;
							}}
							title={isSelected ? `Town hall ${th.level} is already selected` : `Town hall ${th.level}`}
						>
							<div class="flex">
								<img src="/clash/town-halls/{th.level}.png" alt="Town hall {th.level}" />
								<p class="body">{th.level}</p>
							</div>
							{#if $townHall === th.level}
								<svg width="13" height="10" viewBox="0 0 8 6" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M3.00044 3.99976L0.999912 2.00024L0 3L3.00044 6L8 1.00047L7.0008 0L3.00044 3.99976Z" fill="#F0F0F0" />
								</svg>
							{/if}
						</button>
					</li>
				{/each}
			</ul>
		</Menu>
		<button class="filter-btn" class:active={filtersLength > 0} type="button" onclick={openFiltersPopup}>
			<svg width="14" height="12" viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path
					d="M5.14196 3.53486e-07C4.61006 -0.000278488 4.09117 0.164419 3.6568 0.471394C3.22243 0.77837 2.89397 1.21251 2.71667 1.71399H0V3.42797H2.71667C2.89372 3.92977 3.22207 4.36429 3.65645 4.67165C4.09082 4.979 4.60984 5.14406 5.14196 5.14406C5.67408 5.14406 6.19309 4.979 6.62747 4.67165C7.06184 4.36429 7.39019 3.92977 7.56725 3.42797H13.7119V1.71399H7.56725C7.38995 1.21251 7.06148 0.77837 6.62711 0.471394C6.19274 0.164419 5.67385 -0.000278488 5.14196 3.53486e-07ZM4.28496 2.57098C4.28496 2.34369 4.37525 2.12571 4.53597 1.96499C4.69669 1.80428 4.91467 1.71399 5.14196 1.71399C5.36925 1.71399 5.58723 1.80428 5.74794 1.96499C5.90866 2.12571 5.99895 2.34369 5.99895 2.57098C5.99895 2.79827 5.90866 3.01625 5.74794 3.17696C5.58723 3.33768 5.36925 3.42797 5.14196 3.42797C4.91467 3.42797 4.69669 3.33768 4.53597 3.17696C4.37525 3.01625 4.28496 2.79827 4.28496 2.57098ZM8.56993 6.85594C8.03803 6.85566 7.51915 7.02036 7.08478 7.32734C6.65041 7.63431 6.32194 8.06845 6.14464 8.56993H0V10.2839H6.14464C6.3217 10.7857 6.65004 11.2202 7.08442 11.5276C7.51879 11.8349 8.03781 12 8.56993 12C9.10205 12 9.62106 11.8349 10.0554 11.5276C10.4898 11.2202 10.8182 10.7857 10.9952 10.2839H13.7119V8.56993H10.9952C10.8179 8.06845 10.4895 7.63431 10.0551 7.32734C9.62071 7.02036 9.10182 6.85566 8.56993 6.85594ZM7.71294 9.42692C7.71294 9.19963 7.80323 8.98165 7.96394 8.82094C8.12466 8.66022 8.34264 8.56993 8.56993 8.56993C8.79722 8.56993 9.0152 8.66022 9.17591 8.82094C9.33663 8.98165 9.42692 9.19963 9.42692 9.42692C9.42692 9.65421 9.33663 9.87219 9.17591 10.0329C9.0152 10.1936 8.79722 10.2839 8.56993 10.2839C8.34264 10.2839 8.12466 10.1936 7.96394 10.0329C7.80323 9.87219 7.71294 9.65421 7.71294 9.42692Z"
					fill="#8C8C8C"
				/>
			</svg>
			{filtersLength > 0 ? `${filtersLength} ` : ''}{filtersLength === 1 ? 'Filter' : 'Filters'}
		</button>
		<button class="filter-btn" class:active={$sort !== undefined} type="button" bind:this={sortMenuEl} onclick={() => (sortMenuShow = !sortMenuShow)}>
			<svg width="17" height="14" viewBox="0 0 17 14" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path
					fill-rule="evenodd"
					clip-rule="evenodd"
					d="M8.99052 4.71102C8.80337 4.52382 8.69824 4.26996 8.69824 4.00526C8.69824 3.74056 8.80337 3.48669 8.99052 3.2995L11.9853 0.304753C12.0773 0.20941 12.1875 0.133362 12.3093 0.0810446C12.4311 0.0287274 12.5621 0.00118948 12.6946 3.76905e-05C12.8272 -0.0011141 12.9586 0.0241433 13.0813 0.074336C13.204 0.124529 13.3154 0.198652 13.4092 0.29238C13.5029 0.386108 13.577 0.497564 13.6272 0.620245C13.6774 0.742926 13.7026 0.874375 13.7015 1.00692C13.7003 1.13947 13.6728 1.27046 13.6205 1.39225C13.5682 1.51404 13.4921 1.62419 13.3968 1.71627L10.402 4.71102C10.2148 4.89816 9.96098 5.00329 9.69628 5.00329C9.43158 5.00329 9.17771 4.89816 8.99052 4.71102Z"
					fill="#8C8C8C"
				/>
				<path
					fill-rule="evenodd"
					clip-rule="evenodd"
					d="M16.3916 4.711C16.2044 4.89815 15.9505 5.00328 15.6858 5.00328C15.4211 5.00328 15.1672 4.89815 14.98 4.711L11.9853 1.71626C11.8035 1.52799 11.7028 1.27583 11.7051 1.01409C11.7074 0.752357 11.8124 0.501984 11.9975 0.316901C12.1825 0.131818 12.4329 0.026833 12.6947 0.0245586C12.9564 0.0222842 13.2085 0.122902 13.3968 0.304741L16.3916 3.29948C16.5787 3.48668 16.6838 3.74054 16.6838 4.00524C16.6838 4.26994 16.5787 4.52381 16.3916 4.711Z"
					fill="#8C8C8C"
				/>
				<path
					fill-rule="evenodd"
					clip-rule="evenodd"
					d="M12.6917 2.00877C12.9564 2.00877 13.2103 2.11395 13.3976 2.30115C13.5848 2.48836 13.6899 2.74227 13.6899 3.00702V10.993C13.6899 11.2578 13.5848 11.5117 13.3976 11.6989C13.2103 11.8861 12.9564 11.9912 12.6917 11.9912C12.4269 11.9912 12.173 11.8861 11.9858 11.6989C11.7986 11.5117 11.6934 11.2578 11.6934 10.993V3.00702C11.6934 2.74227 11.7986 2.48836 11.9858 2.30115C12.173 2.11395 12.4269 2.00877 12.6917 2.00877ZM8.40621 9.28899C8.59335 9.47619 8.69848 9.73005 8.69848 9.99475C8.69848 10.2595 8.59335 10.5133 8.40621 10.7005L5.41147 13.6953C5.2232 13.8771 4.97104 13.9777 4.7093 13.9754C4.44756 13.9732 4.19719 13.8682 4.01211 13.6831C3.82702 13.498 3.72204 13.2476 3.71976 12.9859C3.71749 12.7242 3.81811 12.472 3.99995 12.2837L6.99469 9.28899C7.18189 9.10185 7.43575 8.99672 7.70045 8.99672C7.96515 8.99672 8.21901 9.10185 8.40621 9.28899Z"
					fill="#8C8C8C"
				/>
				<path
					fill-rule="evenodd"
					clip-rule="evenodd"
					d="M1.00419 9.28898C1.19139 9.10184 1.44525 8.9967 1.70995 8.9967C1.97465 8.9967 2.22851 9.10184 2.41571 9.28898L5.41045 12.2837C5.50579 12.3758 5.58184 12.486 5.63416 12.6077C5.68648 12.7295 5.71401 12.8605 5.71517 12.9931C5.71632 13.1256 5.69106 13.2571 5.64087 13.3797C5.59068 13.5024 5.51655 13.6139 5.42282 13.7076C5.3291 13.8013 5.21764 13.8755 5.09496 13.9257C4.97228 13.9759 4.84083 14.0011 4.70828 14C4.57574 13.9988 4.44475 13.9713 4.32296 13.9189C4.20117 13.8666 4.09101 13.7906 3.99893 13.6952L1.00419 10.7005C0.817045 10.5133 0.711914 10.2594 0.711914 9.99474C0.711914 9.73004 0.817045 9.47618 1.00419 9.28898Z"
					fill="#8C8C8C"
				/>
				<path
					fill-rule="evenodd"
					clip-rule="evenodd"
					d="M4.70528 11.9912C4.44053 11.9912 4.18662 11.8861 3.99941 11.6989C3.8122 11.5117 3.70703 11.2577 3.70703 10.993V3.00702C3.70703 2.74227 3.8122 2.48836 3.99941 2.30115C4.18662 2.11395 4.44053 2.00877 4.70528 2.00877C4.97003 2.00877 5.22394 2.11395 5.41115 2.30115C5.59835 2.48836 5.70353 2.74227 5.70353 3.00702V10.993C5.70353 11.2577 5.59835 11.5117 5.41115 11.6989C5.22394 11.8861 4.97003 11.9912 4.70528 11.9912Z"
					fill="#8C8C8C"
				/>
			</svg>
			{$sort !== undefined ? $sort : 'Sort'}
		</button>
		<Menu bind:open={sortMenuShow} elRef={sortMenuEl}>
			<ul class="menu sort-menu">
				{#each sortOptions as option}
					<li>
						<button
							type="button"
							class="focus-grey"
							onclick={() => {
								$sort = $sort === option ? undefined : option;
								sortMenuShow = false;
							}}
						>
							{option}
							{#if $sort === option}
								<svg width="13" height="10" viewBox="0 0 8 6" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M3.00044 3.99976L0.999912 2.00024L0 3L3.00044 6L8 1.00047L7.0008 0L3.00044 3.99976Z" fill="#F0F0F0" />
								</svg>
							{/if}
						</button>
					</li>
				{/each}
			</ul>
		</Menu>
	</div>
</div>

<style>
	.filters {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		gap: 0.5em;
	}
	.left {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.filter-btns {
		display: flex;
		align-items: center;
	}
	.filter-btn {
		display: flex;
		align-items: center;
		gap: 5px;
		color: #8c8c8c;
		font-weight: 500;
		border-radius: 4px;
		padding: 4px 8px;
		transition: all 0.15s ease-in-out;
		font-size: var(--fs);
		line-height: var(--fs-lh);
		cursor: pointer;
	}
	.filter-btn.active {
		color: #cb995b;
	}
	.filter-btn.active path {
		fill: #cb995b;
	}
	.filter-btn:hover,
	.filter-btn:focus {
		background-color: var(--grey-800);
		outline: none;
	}

	.menu {
		box-shadow: 2px 8px 10px 6px hsla(0, 0%, 0%, 0.4);
		background-color: var(--grey-800);
		border: 1px solid var(--grey-550);
		border-radius: 6px;
	}
	.menu li:first-child,
	.menu li:first-child button {
		border-radius: 6px 6px 0 0;
	}
	.menu li:last-child,
	.menu li:last-child button {
		border-radius: 0 0 6px 6px;
	}
	.menu li:not(:last-child) {
		border-bottom: 1px solid var(--grey-550);
	}
	.menu li button {
		display: flex;
		align-items: center;
		justify-content: space-between;
		transition:
			background 0.15s ease-in-out,
			visibility 0s;
		font-size: var(--fs);
		line-height: var(--fs);
		color: var(--grey-100);
		text-align: left;
		padding: 10px;
		width: 100%;
		gap: 8px;
	}
	.menu li button:hover {
		background-color: var(--grey-850);
	}
	.menu li button svg path {
		fill: var(--grey-100);
	}
	.menu li button svg {
		display: block;
	}

	.sort-menu li {
		min-width: 110px;
	}
	.th-menu {
		overflow-y: auto;
		max-height: 250px;
		min-width: 125px;
	}
	.th-menu li button svg path {
		fill: var(--grey-100);
	}
	.th-menu .town-hall .flex {
		height: 22px;
		display: flex;
		gap: 4px;
	}
	.th-menu .town-hall {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
	}
	.th-menu .town-hall .body {
		font-family: 'Clash', sans-serif;
		color: var(--grey-100);
		min-width: 2ch;
	}
	.th-menu .town-hall img {
		max-height: 100%;
		width: auto;
	}

	.th-filter {
		flex: 1 0 0px;
	}
	.th-filter img {
		max-height: 22px;
		width: auto;
	}
	.th-filter:not(.active) img {
		filter: grayscale();
	}

	@media (max-width: 850px) {
		.th-filter img {
			max-height: 22px;
		}
	}

	@media (max-width: 615px) {
		:global(.searchbox) {
			--input-width: 100%;
		}
		.th-filter {
			flex: unset;
		}
		.filters {
			flex-flow: column-reverse;
			align-items: stretch;
		}
	}
</style>
