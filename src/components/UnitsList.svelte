<script lang="ts">
	import type { Snippet } from 'svelte';
	import { HOLD_REMOVE_SPEED } from '$shared/utils';
	import type { UnitHome } from '$types';
	import UnitDisplay from './UnitDisplay.svelte';
	import type { ArmyModel } from '$models';

	type Props = {
		model: ArmyModel;
		housedIn: UnitHome;
		unitsRemovable?: boolean;
		extraUnits?: Snippet;
	} & Record<string, unknown>;
	const { model, housedIn, unitsRemovable = false, extraUnits, ...rest }: Props = $props();

	const selectedUnits = $derived(housedIn === 'armyCamp' ? model.units : model.ccUnits);
	const _troopUnits = $derived(selectedUnits.filter((unit) => unit.info.type === 'Troop'));
	const troopUnits = $derived([..._troopUnits.filter((x) => !x.info.isSuper), ..._troopUnits.filter((x) => x.info.isSuper)]);
	const siegeUnits = $derived(selectedUnits.filter((unit) => unit.info.type === 'Siege'));
	const spellUnits = $derived(selectedUnits.filter((unit) => unit.info.type === 'Spell'));

	let holdInterval: ReturnType<typeof setInterval> | null = null;

	function initHoldRemove(name: string) {
		if (!unitsRemovable) {
			return;
		}
		// remove straight away in case user clicked
		remove(name);
		// if we removed the last troop/spell stop removing
		const exists = selectedUnits.find((unit) => unit.info.name === name);
		if (!exists) {
			stopHold();
			return;
		}
		holdInterval = setInterval(() => {
			remove(name);
			// if we removed the last troop/spell stop removing
			const exists = selectedUnits.find((unit) => unit.info.name === name);
			if (!exists) {
				stopHold();
			}
		}, HOLD_REMOVE_SPEED);
	}

	function stopHold() {
		if (!unitsRemovable) {
			return;
		}
		clearInterval(holdInterval ?? undefined);
		holdInterval = null;
	}

	function remove(name: string) {
		if (!unitsRemovable) {
			return;
		}
		model.decrementUnitAmount(name, housedIn);
	}
</script>

<!-- Handle mouseup on window in case user mouses cursor from the card then does mouseup -->
<svelte:window onmouseup={stopHold} />

<ul class="units-list {unitsRemovable ? 'removable' : ''}">
	{#if extraUnits}
		{@render extraUnits()}
	{/if}
	{#each [...troopUnits, ...spellUnits, ...siegeUnits] as unit}
		<li>
			<button
				type="button"
				onmousedown={() => initHoldRemove(unit.info.name)}
				onmouseleave={() => stopHold()}
				onkeypress={(ev) => {
					if (ev.key !== 'Enter') {
						return;
					}
					remove(unit.info.name);
				}}
				tabindex={unitsRemovable ? undefined : -1}
			>
				<UnitDisplay unit={unit.info} amount={unit.amount} {...rest} />
			</button>
		</li>
	{/each}
</ul>
