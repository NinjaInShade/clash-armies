<script lang="ts">
	import { requireHTML } from '$lib/client/state.svelte';
	import { getContext } from 'svelte';
	import type { FiltersState, PickUnit, Filters } from '$client/filtersState.svelte';
	import ActionButton from '$components/ActionButton.svelte';
	import THFilterButton from '$components/Armies/THFilterButton.svelte';
	import Checkbox from '$components/Checkbox.svelte';
	import EquipmentDisplay from '$components/EquipmentDisplay.svelte';
	import PetDisplay from '$components/PetDisplay.svelte';
	import RadioButton, { type RadioOption } from '$components/RadioButton.svelte';
	import UnitDisplay from '$components/UnitDisplay.svelte';
	import { ARMY_TAGS, MAX_FILTER_UNITS, MAX_FILTER_EQUIPMENTS, MAX_FILTER_PETS } from '$shared/utils';
	import type { AppState } from '$types';

	const YES_NO_OPTIONS: RadioOption<boolean | undefined>[] = [
		{ value: true, label: 'Yes' },
		{ value: false, label: 'No' },
	];
	const COMPOSITION_OPTIONS: RadioOption<string | undefined>[] = [
		{ value: 'Ground', label: 'Ground' },
		{ value: 'Air', label: 'Air' },
		{ value: 'Hybrid', label: 'Hybrid' },
	];
	// Per `pickType` max selection count, matching the server's filtering maximums in `armyListQueryFieldSchemas`.
	const MAX_FOR_PICK_TYPE: Record<PickUnit['pickType'], number> = {
		unit: MAX_FILTER_UNITS,
		equipment: MAX_FILTER_EQUIPMENTS,
		pet: MAX_FILTER_PETS,
	};

	type Props = {
		/** The source of truth for filter state */
		filters: FiltersState;
		/**
		 * Whether to show the town hall filter.
		 * @default true
		 */
		showTHFilter?: boolean;
		/**
		 * Whether the drawer is open.
		 * Only relevant on mobile where it renders as an off-page panel.
		 * @default false
		 */
		open?: boolean;
	};
	let { filters, showTHFilter = true, open = $bindable(false) }: Props = $props();

	const app = getContext<AppState>('app');

	const unitsList = $derived.by(() => {
		// TODO: shared util for stuff like this (see browse +page.svelte for another example).
		const troops: PickUnit[] = [];
		const spells: PickUnit[] = [];
		const sieges: PickUnit[] = [];
		const equipment: PickUnit[] = app.equipment
			.toSorted((a, b) => {
				const heroIndexA = app.heroNames.indexOf(a.hero);
				const heroIndexB = app.heroNames.indexOf(b.hero);
				if (+a.epic !== +b.epic) {
					return +a.epic - +b.epic;
				}
				if (heroIndexA !== heroIndexB) {
					return heroIndexA - heroIndexB;
				}
				return 0;
			})
			.map((eq) => ({ pickType: 'equipment', ...eq }));
		const pets: PickUnit[] = app.pets.map((u) => ({ pickType: 'pet', ...u }));
		for (const unit of app.units) {
			switch (unit.type) {
				case 'Troop':
					troops.push({ pickType: 'unit', ...unit });
					break;
				case 'Spell':
					spells.push({ pickType: 'unit', ...unit });
					break;
				case 'Siege':
					sieges.push({ pickType: 'unit', ...unit });
					break;
			}
		}
		return [...troops, ...spells, ...sieges, ...equipment, ...pets];
	});
	// Kept in the same order as `unitsList`, rather than selection order
	const selectedUnits = $derived.by(() => {
		const selected = filters.value.units ?? [];
		const selectedKeys = new Set(selected.map((s) => `${s.pickType}:${s.name}`));
		return unitsList.filter((u) => selectedKeys.has(`${u.pickType}:${u.name}`));
	});

	// Lock page scroll while drawer is open as a mobile off-page panel
	$effect(() => {
		if (!open) {
			return;
		}
		requireHTML().classList.add('hide-overflow');
		return () => {
			requireHTML().classList.remove('hide-overflow');
		};
	});

	function onKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) {
			open = false;
		}
	}

	function getUnitCardData(unit: PickUnit, filterValues: Filters) {
		const selectedUnits = filterValues.units ?? [];
		const alreadySelected = selectedUnits.find((u) => u.name === unit.name && u.pickType === unit.pickType) !== undefined;
		const disableSuperTroop = filterValues.noSuperTroops && unit.pickType === 'unit' && unit.isSuper;
		const disableEquipment = filterValues.hasEquipment === false && unit.pickType === 'equipment';
		const disableEpicEquipment = filterValues.noEpicEquipment && unit.pickType === 'equipment' && unit.epic;
		const disablePet = filterValues.hasPets === false && unit.pickType === 'pet';
		const maxForPickType = MAX_FOR_PICK_TYPE[unit.pickType];
		const disableMaxReached = !alreadySelected && selectedUnits.filter((u) => u.pickType === unit.pickType).length >= maxForPickType;
		let title = undefined;
		if (alreadySelected) {
			title = 'This unit is already selected, click to remove it';
		} else if (disableSuperTroop) {
			title = 'No super troops filter is applied';
		} else if (disableEquipment) {
			title = 'No equipment filter is applied';
		} else if (disableEpicEquipment) {
			title = 'No epic equipment filter is applied';
		} else if (disablePet) {
			title = 'No pets filter is applied';
		} else if (disableMaxReached) {
			title = `You can only select up to ${maxForPickType} at once`;
		}
		return {
			disabled: disableSuperTroop || disableEquipment || disableEpicEquipment || disablePet || disableMaxReached,
			alreadySelected,
			title,
		};
	}

	function onUnitListClick(unit: PickUnit, pickMode: boolean, alreadySelected: boolean) {
		if (pickMode) {
			if (alreadySelected) {
				filters.removeUnit(unit);
			} else {
				filters.addUnit(unit);
			}
		} else {
			filters.removeUnit(unit);
		}
	}

	function resetAllFilters() {
		filters.resetAllFilters();
		open = false;
	}
</script>

<svelte:window onkeydown={onKeyDown} />

{#if open}
	<button type="button" class="backdrop" onclick={() => (open = false)} aria-label="Close filters"></button>
{/if}

<div class="filters-drawer" class:open>
	<section>
		<div class="drawer-header">
			<h3>
				Filters
				{#if filters.count}
					({filters.count})
				{/if}
			</h3>
			<div class="header-actions">
				<ActionButton theme="danger" class={filters.count ? '' : 'invisible'} onclick={resetAllFilters}>
					<svg width="17" height="14" viewBox="0 0 17 14" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path
							d="M9.33333 0C7.47681 0 5.69634 0.737497 4.38358 2.05025C3.07083 3.36301 2.33333 5.14348 2.33333 7H0L3.02555 10.0256L3.08 10.1344L6.22222 7H3.88889C3.88889 3.99 6.32333 1.55555 9.33333 1.55555C12.3433 1.55555 14.7778 3.99 14.7778 7C14.7778 10.01 12.3433 12.4444 9.33333 12.4444C7.83222 12.4444 6.47111 11.83 5.49111 10.8422L4.38666 11.9467C5.03488 12.5984 5.80571 13.1155 6.65471 13.4679C7.50372 13.8203 8.41409 14.0011 9.33333 14C11.1898 14 12.9703 13.2625 14.2831 11.9497C15.5958 10.637 16.3333 8.85651 16.3333 7C16.3333 5.14348 15.5958 3.36301 14.2831 2.05025C12.9703 0.737497 11.1898 2.76642e-08 9.33333 0ZM8.55555 3.88889V7.77777L11.8844 9.75333L12.4444 8.81222L9.72222 7.19444V3.88889H8.55555Z"
							fill="currentColor"
						/>
					</svg>
					Reset
				</ActionButton>
				<button type="button" class="close-btn focus-grey" onclick={() => (open = false)} aria-label="Close filters">
					<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path
							fill-rule="evenodd"
							clip-rule="evenodd"
							d="M7.88242 10.0044L13.1854 15.3074C13.4668 15.5888 13.8485 15.7469 14.2464 15.7469C14.6444 15.7469 15.026 15.5888 15.3074 15.3074C15.5888 15.026 15.7469 14.6444 15.7469 14.2464C15.7469 13.8485 15.5888 13.4668 15.3074 13.1854L10.0024 7.88243L15.3064 2.57943C15.4457 2.4401 15.5561 2.2747 15.6315 2.09268C15.7068 1.91066 15.7456 1.71558 15.7455 1.51858C15.7455 1.32158 15.7067 1.12652 15.6312 0.944534C15.5558 0.762548 15.4452 0.597201 15.3059 0.457934C15.1666 0.318668 15.0012 0.208208 14.8192 0.132863C14.6371 0.057517 14.4421 0.0187609 14.2451 0.0188074C14.0481 0.0188538 13.853 0.0577016 13.671 0.133133C13.489 0.208564 13.3237 0.319102 13.1844 0.458435L7.88242 5.76143L2.57942 0.458435C2.44111 0.315105 2.27565 0.200756 2.09268 0.122057C1.90971 0.0433583 1.7129 0.00188689 1.51374 6.29038e-05C1.31457 -0.00176108 1.11703 0.0360986 0.932653 0.111433C0.748274 0.186767 0.580745 0.298068 0.43984 0.43884C0.298935 0.579612 0.187477 0.747037 0.111969 0.931345C0.0364604 1.11565 -0.00158556 1.31315 5.06168e-05 1.51232C0.00168679 1.71149 0.0429722 1.90834 0.121498 2.09138C0.200024 2.27443 0.314218 2.44 0.457417 2.57843L5.76242 7.88243L0.458417 13.1864C0.315218 13.3249 0.201025 13.4904 0.122499 13.6735C0.0439726 13.8565 0.00268672 14.0534 0.00105054 14.2525C-0.000585633 14.4517 0.0374603 14.6492 0.112969 14.8335C0.188477 15.0178 0.299935 15.1853 0.44084 15.326C0.581745 15.4668 0.749274 15.5781 0.933653 15.6534C1.11803 15.7288 1.31557 15.7666 1.51474 15.7648C1.7139 15.763 1.91071 15.7215 2.09368 15.6428C2.27665 15.5641 2.44211 15.4498 2.58042 15.3064L7.88242 10.0044Z"
							fill="currentColor"
						/>
					</svg>
				</button>
			</div>
		</div>

		{#if showTHFilter}
			<div class="fieldset th-fieldset">
				<span class="label">Town Hall</span>
				<THFilterButton value={filters.value.townHall} onChange={(value) => filters.setTownHall(value ?? undefined)} />
			</div>
		{/if}

		<div class="fieldset units-fieldset">
			<span class="label">Units</span>
			<!-- TODO: heroes -->
			<!-- TODO: hide specific units from list if implicitly filtering by them (e.g. `/armies/troops/archer` page) -->
			{@render unitList(true)}
			{@render unitList(false)}
		</div>
	</section>

	<section>
		<div class="fieldset">
			<span class="label">Attack Type</span>
			<div class="pill-row">
				{#each COMPOSITION_OPTIONS as option (option.value)}
					{@render filterBtn(option.label, filters.value.attackType === option.value, () =>
						filters.setAttackType(filters.value.attackType === option.value ? undefined : option.value)
					)}
				{/each}
			</div>
		</div>

		<div class="fieldset">
			<span class="label">Tags</span>
			<div class="pill-row">
				{#each ARMY_TAGS as tag (tag)}
					{@render filterBtn(tag, filters.value.tags?.includes(tag) ?? false, () => filters.toggleTag(tag))}
				{/each}
			</div>
		</div>
	</section>

	<section>
		<div class="check-list" style="--label-width: 13ch">
			<div class="inner-fieldset">
				<span class="label">Guide</span>
				<Checkbox value={filters.value.hasGuide === true} label="Yes" onChange={filters.setHasGuide} />
			</div>
			<div class="inner-fieldset">
				<!-- TODO: support yes/no -->
				<span class="label">Super Troops</span>
				<Checkbox value={filters.value.noSuperTroops === true} label="No" onChange={filters.setNoSuperTroops} />
			</div>
			<div class="inner-fieldset">
				<!-- TODO: support yes/no -->
				<span class="label">Epic Equipment</span>
				<Checkbox value={filters.value.noEpicEquipment === true} label="No" onChange={filters.setNoEpicEquipment} />
			</div>
			<div class="inner-fieldset">
				<span class="label">Clan Castle</span>
				<RadioButton value={filters.value.hasClanCastle} options={YES_NO_OPTIONS} onChange={filters.setHasClanCastle} />
			</div>
			<div class="inner-fieldset">
				<span class="label">Equipment</span>
				<RadioButton value={filters.value.hasEquipment} options={YES_NO_OPTIONS} onChange={filters.setHasEquipment} />
			</div>
			<div class="inner-fieldset">
				<span class="label">Pets</span>
				<RadioButton value={filters.value.hasPets} options={YES_NO_OPTIONS} onChange={filters.setHasPets} />
			</div>
		</div>
	</section>
</div>

{#snippet filterBtn(text: string, isActive: boolean, onclick: () => void)}
	<ActionButton theme={isActive ? 'primary-dark' : 'grey'} class={isActive ? 'focus-primary' : 'focus-grey'} {onclick}>
		{text}
	</ActionButton>
{/snippet}

{#snippet unitList(picker: boolean)}
	<ul class={picker ? 'unit-picker-list' : 'unit-picker-list removable'}>
		{#each picker ? unitsList : selectedUnits as unit (`${unit.pickType}:${unit.name}`)}
			{@const { alreadySelected, disabled, title } = getUnitCardData(unit, filters.value)}
			<li>
				<button
					type="button"
					class="pick-button"
					class:visually-disabled={picker && alreadySelected}
					disabled={picker ? disabled : false}
					onclick={() => {
						onUnitListClick(unit, picker, alreadySelected);
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

<style>
	.filters-drawer {
		background-color: var(--grey-800);
		border: 1px dashed var(--grey-500);
		border-radius: 6px;
		width: 100%;

		> section {
			padding: 16px 20px;

			&:not(:first-of-type) {
				border-top: 1px dashed var(--grey-500);
			}
		}

		& .drawer-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 8px;
			gap: 8px;

			& .header-actions {
				display: flex;
				align-items: center;
				gap: 8px;

				& :global(.invisible) {
					/* Keep in flow rather than remove so headers height doesn't shift */
					visibility: hidden;
					/*
					    Without this there's a noticeable lag before the button actually disappears.
						TODO: consider removing the global button/a transition in `base.css`.
					*/
					transition: none;
				}
			}
		}

		& h3 {
			font-size: var(--fs);
			line-height: var(--fs-lh);
			font-family: 'Poppins', sans-serif;
			letter-spacing: 2px;
			text-transform: uppercase;
			font-weight: 700;
			color: var(--grey-400);
		}

		& .close-btn {
			display: none;
			align-items: center;
			justify-content: center;
			padding: 4px;
			border-radius: 2px;
			color: var(--grey-100);
			flex-shrink: 0;

			&:hover {
				background-color: var(--grey-600);
			}

			& svg {
				display: block;
			}
		}

		& .label {
			display: flex;
			font-size: var(--fs);
			line-height: var(--fs-lh);
			font-family: 'Poppins', sans-serif;
			color: var(--grey-100);
			font-weight: 400;
			margin-bottom: 6px;
		}

		& .fieldset {
			& + .fieldset {
				margin-top: 16px;
			}

			.pill-row {
				display: flex;
				flex-flow: row wrap;
				gap: 6px;
			}

			& :global(.action-btn) {
				font-weight: 400;
				text-transform: none;
				letter-spacing: unset;
				font-size: 16px;
				line-height: 16px;
				padding: 7px 9px;
			}

			& .unit-picker-list {
				--max-height: 160px;
				--unit-min-size: 46px;

				& .pick-button {
					cursor: pointer;
				}
			}

			& .unit-picker-list.removable {
				scrollbar-gutter: stable;

				&:has(li) {
					border-top: 1px dashed var(--grey-500);
					padding-top: 8px;
					margin-top: 8px;
				}
			}

			@media (max-width: 900px) {
				& + .fieldset {
					margin-top: 12px;
				}
			}
		}

		.check-list {
			& .inner-fieldset {
				display: flex;
				align-items: center;
				justify-content: flex-start;
				gap: 4px;

				&:not(:first-child) {
					margin-top: 12px;
				}

				& .label {
					width: var(--label-width, auto);
					margin-bottom: 0;
				}
			}
		}
	}

	.backdrop {
		display: none;
	}

	@media (max-width: 900px) {
		.backdrop {
			display: block;
			position: fixed;
			inset: 0;
			z-index: 1;
			background-color: hsla(0, 0%, 0%, 0.6);
			border: none;
			cursor: default;
			touch-action: none;
		}

		.filters-drawer {
			position: fixed;
			top: 0;
			left: 0;
			bottom: 0;
			z-index: 2;
			width: min(300px, 100%);
			height: 100dvh;
			border-radius: 0;
			overflow-y: auto;
			overscroll-behavior: contain;
			transform: translateX(-100%);
			transition: transform 0.25s ease-in-out;

			&.open {
				transform: translateX(0);
			}

			& .close-btn {
				display: flex;
			}
		}

		.filters-drawer {
			& .fieldset {
				& .unit-picker-list {
					--max-height: 145px;
					--unit-min-size: 42px;
				}
			}

			/* Shown inline in `ArmyList` instead, next to the search/filters controls */
			& .th-fieldset {
				display: none;
			}
		}
	}
</style>
