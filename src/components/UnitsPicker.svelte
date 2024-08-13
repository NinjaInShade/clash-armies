<script lang="ts">
	import { getContext } from 'svelte';
	import { getTotals, HOLD_ADD_SPEED, requireUnit } from '~/lib/shared/utils';
	import type { Optional, AppState, Unit, SaveUnit, ArmyUnit, UnitType, TownHall, Totals } from '~/lib/shared/types';
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
		getUnitLevel(name: string, type: UnitType, ctx: { th: TownHall; units: Unit[] }): number;
		selectedUnits: Optional<ArmyUnit, 'id'>[];
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

	function shouldDisableSuper(unit: Unit, selected: SaveUnit[]) {
		if (housedIn !== 'armyCamp') {
			return;
		}
		// Disable if reached max unique super limit and this troop isn't one already selected
		const superTroops = selected.filter((u) => {
			const appUnit = requireUnit(u.unitId, { units: app.units });
			return appUnit.isSuper;
		});
		return unit.isSuper && !selected.find((u) => u.unitId === unit.id) && superTroops.length >= 2;
	}

	function willOverflowHousingSpace(unit: Unit) {
		const copy: ArmyUnit[] = JSON.parse(JSON.stringify(selectedUnits));
		const preview = add(unit, copy);
		const previewFull = preview.map((u) => ({ ...requireUnit(u.unitId, { units: app.units }), amount: u.amount }));
		const { troops, sieges, spells } = getTotals(previewFull);
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

	function initHoldAdd(unit: Unit) {
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

	function add(unit: Unit, arr = selectedUnits) {
		const existing = arr.find((item) => item.unitId === unit.id);
		if (existing) {
			existing.amount += 1;
		} else {
			arr.push({ unitId: unit.id, home: housedIn, amount: 1, ...unit, id: undefined });
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
		{@const level = thData ? getUnitLevel(unit.name, unit.type, { th: thData, units: app.units }) : -1}
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
