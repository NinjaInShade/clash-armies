<script lang="ts">
	import { getContext, untrack } from 'svelte';
	import { HOLD_ADD_SPEED } from '$shared/utils';
	import type { AppState, Unit, UnitType, UnitHome } from '$types';
	import { ArmyModel, UnitModel } from '$models';
	import UnitDisplay from './UnitDisplay.svelte';

	type TitleOptions = {
		level: number;
		type: Unit['type'];
		reachedMaxAmount: boolean;
		reachedSuperLimit?: boolean;
	};
	type Props = {
		model: ArmyModel;
		type: UnitType;
		housedIn: UnitHome;
	};
	const { model, type, housedIn }: Props = $props();
	const app = getContext<AppState>('app');

	const selectedUnits = $derived(housedIn === 'armyCamp' ? model.units : model.ccUnits);
	const capacity = $derived(housedIn === 'armyCamp' ? model.capacity : model.ccCapacity);
	const allUnits = $derived(app.units.filter((u) => u.type === type));
	const sortedUnits = $derived([...allUnits.filter((u) => !u.isSuper), ...allUnits.filter((u) => u.isSuper)]);
	const heading = $derived(`Select ${type === 'Troop' ? 'troops' : type === 'Siege' ? 'siege machine' : 'spells'}`);

	let holdInterval: ReturnType<typeof setInterval> | null = null;

	function shouldDisableSuper(unit: Unit, selected: UnitModel[]) {
		if (housedIn !== 'armyCamp') {
			return;
		}
		// Disable if reached max unique super limit and this troop isn't one already selected
		const superTroops = selected.filter((u) => u.info.isSuper);
		return unit.isSuper && !selected.find((u) => u.unitId === unit.id) && superTroops.length >= 2;
	}

	function willOverflowHousingSpace(unit: Unit) {
		// Register selected units and amount as reactive deps
		for (const selected of selectedUnits) {
			selected.amount;
		}
		return untrack(() => {
			const copy = selectedUnits.map((u) => new UnitModel(model.gameData, u));
			const preview = add(unit, copy);
			const { troops, sieges, spells } = UnitModel.getTotals(preview);
			return troops > capacity.troops || sieges > capacity.sieges || spells > capacity.spells;
		});
	}

	function getTitle(opts: TitleOptions) {
		const { level, type, reachedMaxAmount, reachedSuperLimit } = opts;
		if (level === -1) {
			return `This ${type.toLowerCase()} is unable to be used at town hall ${model.townHall}!`;
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
			const newUnit = new UnitModel(model.gameData, { unitId: unit.id, home: housedIn, amount: 1 });
			arr.push(newUnit);
		}
		return arr;
	}

	function getLevel(unit: Unit) {
		if (housedIn === 'armyCamp') {
			return UnitModel.getMaxLevel(unit, model.townHall, model.gameData);
		} else {
			return UnitModel.getMaxCcLevel(unit, model.townHall, model.gameData);
		}
	}
</script>

<!-- Handle mouseup on window in case user mouses cursor from the card then does mouseup -->
<svelte:window onmouseup={stopHold} />

<h3>{heading}</h3>
<ul class="picker-list">
	{#each sortedUnits as unit}
		{@const disableSuper = shouldDisableSuper(unit, selectedUnits)}
		{@const level = getLevel(unit)}
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
				<UnitDisplay {unit} {level} {title} />
			</button>
		</li>
	{/each}
</ul>
