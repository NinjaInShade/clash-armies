<script lang="ts">
	import { getContext } from 'svelte';
	import { getTotals, getSuperTroopCount, HOLD_ADD_SPEED } from '~/lib/shared/utils';
	import type { AppState, Unit, ArmyUnit, UnitType, TownHall, Totals } from '~/lib/shared/types';
	import C from '~/components';

	type TitleOptions = {
		level: number;
		type: Unit['type'];
		reachedMaxAmount: boolean;
		reachedSuperLimit?: boolean;
	};
	type Props = {
		type: UnitType;
		capacity: Omit<Totals, 'time'>;
		getUnitLevel(unit: Unit | ArmyUnit, ctx: { th: TownHall; units: Unit[] }): number;
		selectedUnits: ArmyUnit[];
		selectedTownHall: number;
		housedIn: ArmyUnit['home'];
	};
	const { type, capacity, getUnitLevel, selectedUnits = $bindable(), selectedTownHall, housedIn }: Props = $props();
	const app = getContext<AppState>('app');

	const thData = $derived(app.townHalls.find((th) => th.level === selectedTownHall));
	const allUnits = $derived(app.units.filter((u) => u.type === type));
	const sortedUnits = $derived([...allUnits.filter((u) => !u.isSuper), ...allUnits.filter((u) => u.isSuper)]);
	const heading = $derived(`Select ${type === 'Troop' ? 'troops' : type === 'Siege' ? 'siege machine' : 'spells'}`);

	let holdInterval: ReturnType<typeof setInterval> | null = null;

	function shouldDisableSuper(unit: Unit, selected: ArmyUnit[]) {
		if (housedIn !== 'armyCamp') {
			return;
		}
		// Disable if reached max unique super limit and this troop isn't one already selected
		return unit.isSuper && !selected.find((u) => u.name === unit.name) && getSuperTroopCount(selected, { units: app.units }) >= 2;
	}

	function willOverflowHousingSpace(unit: ArmyUnit) {
		const selectedCopy: ArmyUnit[] = JSON.parse(JSON.stringify(selectedUnits));
		const selectedPreview = add(unit, selectedCopy);
		const { troops, sieges, spells } = getTotals(selectedPreview);
		return troops > capacity.troops || sieges > capacity.sieges || spells > capacity.spells;
	}

	function getTitle(opts: TitleOptions) {
		const { level, type, reachedMaxAmount, reachedSuperLimit } = opts;
		if (level === -1) {
			return `This ${type.toLowerCase()} is unable to be used at town hall ${selectedTownHall}!`;
		}
		if (reachedMaxAmount) {
			return `There is no space left to house this ${type.toLowerCase()} warrior!`;
		}
		if (reachedSuperLimit) {
			return 'You have reached the max two super troops per army limit warrior!';
		}
		return undefined;
	}

	function initHoldAdd(unit: ArmyUnit) {
		if (willOverflowHousingSpace(unit)) {
			return;
		}
		// add straight away in case user clicked
		add(unit);
		holdInterval = setInterval(() => {
			// if no more housing space  don't try adding & stop
			if (willOverflowHousingSpace(unit)) {
				stopHold();
				return;
			}
			add(unit);
		}, HOLD_ADD_SPEED);
	}

	function stopHold() {
		clearInterval(holdInterval ?? undefined);
		holdInterval = null;
	}

	function add(unit: ArmyUnit, arr = selectedUnits) {
		const existing = arr.find((item) => item.name === unit.name);
		if (existing) {
			existing.amount += 1;
		} else {
			const _unit = app.units.find((x) => x.type === unit.type && x.name === unit.name);
			if (!_unit) {
				throw new Error(`Unknown unit: "${unit.name}"`);
			}
			arr.push({ ...unit, home: housedIn, unitId: _unit.id, amount: 1 });
		}
		return arr;
	}
</script>

<!-- Handle mouseup on window in case user mouses cursor from the card then does mouseup -->
<svelte:window onmouseup={stopHold} />

<h3>{heading}</h3>
<ul class="picker-list">
	{#each sortedUnits as unit}
		{@const disableSuper = shouldDisableSuper(unit, selectedUnits)}
		{@const level = thData ? getUnitLevel(unit, { th: thData, units: app.units }) : -1}
		{@const reachedMaxAmount = willOverflowHousingSpace(unit)}
		{@const title = getTitle({ level, type, reachedMaxAmount, reachedSuperLimit: disableSuper })}
		<li>
			<button
				type="button"
				disabled={reachedMaxAmount || level === -1 || disableSuper}
				onmousedown={() => initHoldAdd(unit)}
				onmouseleave={() => stopHold()}
				onkeypress={(ev) => {
					if (ev.key !== 'Enter') {
						return;
					}
					add(unit);
				}}
			>
				<C.UnitDisplay {...unit} {level} {title} />
			</button>
		</li>
	{/each}
</ul>

<style>
	.picker-list {
		--gap: 6px;
		--max-rows: 3;
		display: flex;
		flex-flow: row wrap;
		gap: var(--gap);
		padding-right: 12px;
		/** Show max 3 rows of units (meant more for mobile so you can still see the unit you've selected at all times) */
		max-height: calc((var(--unit-size) * var(--max-rows)) + (var(--gap) * (var(--max-rows) - 1)));
		overflow-y: auto;
	}
	.picker-list li {
		width: var(--unit-size);
		height: var(--unit-size);
	}
	.picker-list li button {
		display: block;
		width: 100%;
		height: 100%;
	}
	.picker-list li button:disabled {
		filter: grayscale(1);
	}
</style>
