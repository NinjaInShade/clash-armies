<script lang="ts">
	import { getContext } from 'svelte';
	import type { AppState } from '$types';
	import type { PickUnit, Filters } from './Controls.svelte';
	import { VALID_HEROES } from '$shared/utils';
	import ActionButton from '../ActionButton.svelte';
	import UnitDisplay from '../UnitDisplay.svelte';
	import EquipmentDisplay from '../EquipmentDisplay.svelte';
	import PetDisplay from '../PetDisplay.svelte';
	import FocusTrap from '../FocusTrap.svelte';

	type Props = {
		close: (newFilters?: Filters) => void;
		filters: Filters;
	};
	const { close, filters: oldFilters }: Props = $props();

	const app = getContext<AppState>('app');

	const filters = $state<Filters>({ ...oldFilters });

	const sortedUnits = $derived.by(() => {
		const all = getUnits();
		all.sort(sortUnits);
		return all;
	});
	const sortedPickedUnits = $derived.by(() => {
		const picked = [...requireUnitsFilter()];
		picked.sort(sortUnits);
		return picked;
	});

	function getUnits() {
		const units: PickUnit[] = [];
		units.push(...app.units.map((u) => ({ pickType: 'unit', ...u }) as const));
		units.push(...app.equipment.map((u) => ({ pickType: 'equipment', ...u }) as const));
		units.push(...app.pets.map((u) => ({ pickType: 'pet', ...u }) as const));
		return units;
	}

	function sortUnits(a: PickUnit, b: PickUnit) {
		const typeOrder = ['unit', 'equipment', 'pet'];
		const typeIndexA = typeOrder.indexOf(a.pickType);
		const typeIndexB = typeOrder.indexOf(b.pickType);
		if (typeIndexA !== typeIndexB) {
			return typeIndexA - typeIndexB;
		}
		if (a.pickType === 'unit' && b.pickType === 'unit') {
			const subTypeOrder = ['Troop', 'Spell', 'Siege'];
			const subTypeIndexA = subTypeOrder.indexOf(a.type);
			const subTypeIndexB = subTypeOrder.indexOf(b.type);
			if (subTypeIndexA !== subTypeIndexB) {
				return subTypeIndexA - subTypeIndexB;
			}
			if (a.type === 'Troop' && b.type === 'Troop') {
				return +a.isSuper - +b.isSuper;
			}
		}
		if (a.pickType === 'equipment' && b.pickType === 'equipment') {
			const heroIndexA = VALID_HEROES.indexOf(a.hero);
			const heroIndexB = VALID_HEROES.indexOf(b.hero);
			if (+a.epic !== +b.epic) {
				return +a.epic - +b.epic;
			}
			if (heroIndexA !== heroIndexB) {
				return heroIndexA - heroIndexB;
			}
		}
		return 0;
	}

	function setHasGuide(value?: boolean) {
		filters.hasGuide = value || undefined;
	}

	function setAttackType(value?: string) {
		filters.attackType = value;
	}

	async function setNoSuperTroops(value?: boolean) {
		const selectedSuperTroops = requireUnitsFilter().filter((u) => u.pickType === 'unit' && u.isSuper).length > 0;
		if (value === true && selectedSuperTroops) {
			const confirmed = await app.confirm('You are filtering by one or more super troops, this will clear those. Select anyway?');
			if (!confirmed) return;
			filters.units = requireUnitsFilter().filter((u) => u.pickType !== 'unit' || !u.isSuper);
		}
		filters.noSuperTroops = value || undefined;
	}

	function setHasClanCastle(value?: boolean) {
		filters.hasClanCastle = value;
	}

	function setHasEquipment(value?: boolean) {
		filters.hasEquipment = value;
	}

	async function setNoEpicEquipment(value?: boolean) {
		const selectedEpicEquipment = requireUnitsFilter().filter((u) => u.pickType === 'equipment' && u.epic).length > 0;
		if (value === true && selectedEpicEquipment) {
			const confirmed = await app.confirm('You are filtering by one or more epic equipment, this will clear those. Select anyway?');
			if (!confirmed) return;
			filters.units = requireUnitsFilter().filter((u) => u.pickType !== 'equipment' || !u.epic);
		}
		filters.noEpicEquipment = value || undefined;
	}

	async function setHasPets(value?: boolean) {
		const selectedPets = requireUnitsFilter().filter((u) => u.pickType === 'pet').length > 0;
		if (value === false && selectedPets) {
			const confirmed = await app.confirm('You are filtering by one or more pets, this will clear those. Select anyway?');
			if (!confirmed) return;
			filters.units = requireUnitsFilter().filter((u) => u.pickType !== 'pet');
		}
		filters.hasPets = value;
	}

	function requireUnitsFilter() {
		if (!filters.units) {
			filters.units = [];
		}
		return filters.units;
	}

	function addUnit(unit: PickUnit) {
		requireUnitsFilter().push(unit);
	}

	function removeUnit(unit: PickUnit) {
		const units = requireUnitsFilter();
		const existingIndex = units.findIndex((u) => u.name === unit.name && u.pickType === unit.pickType);
		if (existingIndex === -1) return;
		units.splice(existingIndex, 1);
	}

	function getUnitCardData(unit: PickUnit, filters: Filters) {
		const alreadySelected = requireUnitsFilter().find((u) => u.name === unit.name && u.pickType === unit.pickType) !== undefined;
		const disableSuperTroop = filters.noSuperTroops && unit.pickType === 'unit' && unit.isSuper;
		const disableEquipment = filters.hasEquipment === false && unit.pickType === 'equipment';
		const disableEpicEquipment = filters.noEpicEquipment && unit.pickType === 'equipment' && unit.epic;
		const disablePet = filters.hasPets === false && unit.pickType === 'pet';
		let title = undefined;
		if (alreadySelected) {
			title = 'This unit is already picked';
		} else if (disableSuperTroop) {
			title = 'No super troops filter is applied';
		} else if (disableEquipment) {
			title = 'No equipment filter is applied';
		} else if (disableEpicEquipment) {
			title = 'No epic equipment filter is applied';
		} else if (disablePet) {
			title = 'No pets filter is applied';
		}
		return {
			disabled: alreadySelected || disableSuperTroop || disableEquipment || disableEpicEquipment || disablePet,
			title,
		};
	}

	function resetFilters() {
		close({});
	}

	function onKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			close(filters);
		}
	}
</script>

<svelte:window onkeydown={onKeyDown} />

{#snippet filterBtn(text: string, isActive: boolean, onclick: Function)}
	<ActionButton theme={isActive ? 'primary-dark' : 'grey'} class={isActive ? 'focus-primary' : 'focus-grey'} {onclick}>
		{text}
	</ActionButton>
{/snippet}

{#snippet unitList(picker: boolean)}
	<ul class={picker ? 'picker-list' : 'units-list removable'}>
		{#each picker ? sortedUnits : sortedPickedUnits as unit}
			{@const { disabled, title } = getUnitCardData(unit, filters)}
			<li>
				<button
					type="button"
					disabled={picker ? disabled : false}
					onclick={() => {
						if (picker) {
							addUnit(unit);
						} else {
							removeUnit(unit);
						}
					}}
					onkeypress={(ev) => {
						if (ev.key !== 'Enter') {
							return;
						}
						if (picker) {
							addUnit(unit);
						} else {
							removeUnit(unit);
						}
					}}
				>
					{#if unit.pickType === 'unit'}
						<UnitDisplay {unit} title={picker ? title : undefined} />
					{:else if unit.pickType === 'equipment'}
						<EquipmentDisplay {...unit} title={picker ? title : undefined} />
					{:else}
						<PetDisplay {...unit} title={picker ? title : undefined} />
					{/if}
				</button>
			</li>
		{/each}
	</ul>
{/snippet}

<FocusTrap>
	<div class="filters-popup">
		<header>
			<h2>Filters</h2>
			<button class="close-btn focus-grey" onclick={() => close()} aria-label="Close modal">
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						fill-rule="evenodd"
						clip-rule="evenodd"
						d="M7.88242 10.0044L13.1854 15.3074C13.4668 15.5888 13.8485 15.7469 14.2464 15.7469C14.6444 15.7469 15.026 15.5888 15.3074 15.3074C15.5888 15.026 15.7469 14.6444 15.7469 14.2464C15.7469 13.8485 15.5888 13.4668 15.3074 13.1854L10.0024 7.88243L15.3064 2.57943C15.4457 2.4401 15.5561 2.2747 15.6315 2.09268C15.7068 1.91066 15.7456 1.71558 15.7455 1.51858C15.7455 1.32158 15.7067 1.12652 15.6312 0.944534C15.5558 0.762548 15.4452 0.597201 15.3059 0.457934C15.1666 0.318668 15.0012 0.208208 14.8192 0.132863C14.6371 0.057517 14.4421 0.0187609 14.2451 0.0188074C14.0481 0.0188538 13.853 0.0577016 13.671 0.133133C13.489 0.208564 13.3237 0.319102 13.1844 0.458435L7.88242 5.76143L2.57942 0.458435C2.44111 0.315105 2.27565 0.200756 2.09268 0.122057C1.90971 0.0433583 1.7129 0.00188689 1.51374 6.29038e-05C1.31457 -0.00176108 1.11703 0.0360986 0.932653 0.111433C0.748274 0.186767 0.580745 0.298068 0.43984 0.43884C0.298935 0.579612 0.187477 0.747037 0.111969 0.931345C0.0364604 1.11565 -0.00158556 1.31315 5.06168e-05 1.51232C0.00168679 1.71149 0.0429722 1.90834 0.121498 2.09138C0.200024 2.27443 0.314218 2.44 0.457417 2.57843L5.76242 7.88243L0.458417 13.1864C0.315218 13.3249 0.201025 13.4904 0.122499 13.6735C0.0439726 13.8565 0.00268672 14.0534 0.00105054 14.2525C-0.000585633 14.4517 0.0374603 14.6492 0.112969 14.8335C0.188477 15.0178 0.299935 15.1853 0.44084 15.326C0.581745 15.4668 0.749274 15.5781 0.933653 15.6534C1.11803 15.7288 1.31557 15.7666 1.51474 15.7648C1.7139 15.763 1.91071 15.7215 2.09368 15.6428C2.27665 15.5641 2.44211 15.4498 2.58042 15.3064L7.88242 10.0044Z"
						fill="#EFEFEF"
					/>
				</svg>
			</button>
		</header>

		<div class="content">
			<section class="group">
				<h3>Tags</h3>
				<div class="row">
					{@render filterBtn('Has guide', filters.hasGuide === true, () => setHasGuide(!filters.hasGuide))}
					{@render filterBtn('Ground', filters.attackType === 'Ground', () => setAttackType(filters.attackType === 'Ground' ? undefined : 'Ground'))}
					{@render filterBtn('Air', filters.attackType === 'Air', () => setAttackType(filters.attackType === 'Air' ? undefined : 'Air'))}
					{@render filterBtn('Hybrid', filters.attackType === 'Hybrid', () => setAttackType(filters.attackType === 'Hybrid' ? undefined : 'Hybrid'))}
				</div>
			</section>

			<section class="group">
				<h3>Units</h3>
				<div class="row">
					{@render filterBtn('No super troops', filters.noSuperTroops === true, () => setNoSuperTroops(!filters.noSuperTroops))}
					{@render filterBtn('Has clan castle', filters.hasClanCastle === true, () => setHasClanCastle(filters.hasClanCastle === true ? undefined : true))}
					{@render filterBtn('No clan castle', filters.hasClanCastle === false, () => setHasClanCastle(filters.hasClanCastle === false ? undefined : false))}
				</div>
			</section>

			<section class="group">
				<h3>Heroes</h3>
				<div class="row">
					{@render filterBtn('Has equipment', filters.hasEquipment === true, () => setHasEquipment(filters.hasEquipment === true ? undefined : true))}
					{@render filterBtn('No equipment', filters.hasEquipment === false, () => setHasEquipment(filters.hasEquipment === false ? undefined : false))}
					{@render filterBtn('No epic equipment', filters.noEpicEquipment === true, () => setNoEpicEquipment(!filters.noEpicEquipment))}
					{@render filterBtn('Has pets', filters.hasPets === true, () => setHasPets(filters.hasPets === true ? undefined : true))}
					{@render filterBtn('No pets', filters.hasPets === false, () => setHasPets(filters.hasPets === false ? undefined : false))}
				</div>
			</section>

			<section class="group">
				<h3>Picker</h3>
				{@render unitList(false)}
				{@render unitList(true)}
			</section>
		</div>

		<div class="controls">
			<ActionButton theme="danger" onclick={resetFilters}>
				<svg width="17" height="14" viewBox="0 0 17 14" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M9.33333 0C7.47681 0 5.69634 0.737497 4.38358 2.05025C3.07083 3.36301 2.33333 5.14348 2.33333 7H0L3.02555 10.0256L3.08 10.1344L6.22222 7H3.88889C3.88889 3.99 6.32333 1.55555 9.33333 1.55555C12.3433 1.55555 14.7778 3.99 14.7778 7C14.7778 10.01 12.3433 12.4444 9.33333 12.4444C7.83222 12.4444 6.47111 11.83 5.49111 10.8422L4.38666 11.9467C5.03488 12.5984 5.80571 13.1155 6.65471 13.4679C7.50372 13.8203 8.41409 14.0011 9.33333 14C11.1898 14 12.9703 13.2625 14.2831 11.9497C15.5958 10.637 16.3333 8.85651 16.3333 7C16.3333 5.14348 15.5958 3.36301 14.2831 2.05025C12.9703 0.737497 11.1898 2.76642e-08 9.33333 0ZM8.55555 3.88889V7.77777L11.8844 9.75333L12.4444 8.81222L9.72222 7.19444V3.88889H8.55555Z"
						fill="currentColor"
					/>
				</svg>
				Reset
			</ActionButton>
			<div class="controls-flex">
				<ActionButton theme="primary-dark" onclick={() => close()}>Cancel</ActionButton>
				<ActionButton theme="primary-dark" onclick={() => close(filters)}>Apply</ActionButton>
			</div>
		</div>
	</div>
</FocusTrap>

<style>
	.filters-popup {
		--unit-size: 55px;
		--bottom-padding: 8px;
		--unit-amount-size: 0px;
		display: flex;
		flex-flow: column nowrap;
		position: fixed;
		transform: translate(-50%, 50%);
		box-shadow: 0 7px 100px 0 hsla(0, 0%, 0%, 0.9);
		background-color: var(--grey-850);
		border: 1px dashed var(--grey-500);
		height: 800px;
		width: 700px;
		max-width: calc(100dvw - 1em);
		max-height: calc(100dvh - 2em);
		border-radius: 6px;
		overflow: hidden;
		bottom: 50%;
		left: 50%;
	}

	.content {
		flex: 1 0 0px;
		border: 1px dashed var(--grey-500);
		border-left: none;
		border-right: none;
		overflow-y: auto;
		height: 100%;
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px 16px;
	}

	header h2 {
		font-size: var(--fs);
		line-height: var(--fs-lh);
		font-family: 'Poppins', sans-serif;
		letter-spacing: 2px;
		text-transform: uppercase;
		font-weight: 700;
	}

	.content {
		padding: 16px 16px;
	}

	.controls {
		display: flex;
		justify-content: space-between;
		padding: 12px 16px;
		gap: 0.5em;
	}
	.controls-flex {
		display: flex;
		gap: 0.5em;
	}
	.controls :global(.action-btn) {
		padding: 8px;
	}

	.close-btn {
		display: flex;
		justify-content: center;
		align-items: center;
		border-radius: 2px;
		padding: 4px;
	}
	.close-btn:hover {
		background-color: var(--grey-600);
	}
	.close-btn svg {
		display: block;
	}

	.group:not(:last-child) {
		margin-bottom: 20px;
	}
	.group h3 {
		display: flex;
		align-items: center;
		gap: 6px;
		font-family: 'Poppins', sans-serif;
		font-size: var(--fs);
		line-height: var(--fs-lh);
		margin-bottom: 6px;
		font-weight: 500;
	}
	.group :global(.action-btn) {
		font-weight: 400;
		text-transform: none;
		letter-spacing: unset;
		font-size: 16px;
		line-height: 16px;
		padding: 7px 9px;
	}
	.row {
		display: flex;
		flex-flow: row wrap;
		gap: 6px;
	}

	.units-list {
		border-bottom: 1px dashed var(--grey-500);
		padding-bottom: 8px;
		padding-right: 12px;
		margin: 12px 0 8px 0;
	}

	.picker-list {
		--max-rows: 5;
		margin-top: 8px;
	}
</style>
