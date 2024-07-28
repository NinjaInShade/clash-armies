<script lang="ts">
	import type { Snippet } from 'svelte';
	import { HOLD_REMOVE_SPEED } from '~/lib/shared/utils';
	import type { Optional, Unit, ArmyUnit } from '~/lib/shared/types';
	import C from '~/components';

	type Props = {
		selectedUnits: Optional<ArmyUnit, 'id'>[];
		unitsRemovable?: boolean;
		extraUnits?: Snippet;
	};
	const { selectedUnits = $bindable(), unitsRemovable = false, extraUnits, ...rest }: Props = $props();

	const _troopUnits = $derived(selectedUnits.filter((unit) => unit.type === 'Troop'));
	const troopUnits = $derived([..._troopUnits.filter((x) => !x.isSuper), ..._troopUnits.filter((x) => x.isSuper)]);
	const siegeUnits = $derived(selectedUnits.filter((unit) => unit.type === 'Siege'));
	const spellUnits = $derived(selectedUnits.filter((unit) => unit.type === 'Spell'));

	let holdInterval: ReturnType<typeof setInterval> | null = null;

	function initHoldRemove(name: Unit['name']) {
		if (!unitsRemovable) {
			return;
		}
		// remove straight away in case user clicked
		remove(name);
		// if we removed the last troop/spell stop removing
		const exists = selectedUnits.find((unit) => unit.name === name);
		if (!exists) {
			stopHold();
			return;
		}
		holdInterval = setInterval(() => {
			remove(name);
			// if we removed the last troop/spell stop removing
			const exists = selectedUnits.find((unit) => unit.name === name);
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

	function remove(name: Unit['name']) {
		if (!unitsRemovable) {
			return;
		}
		const existingIndex = selectedUnits.findIndex((unit) => unit.name === name);
		if (selectedUnits[existingIndex].amount === 1) {
			selectedUnits.splice(existingIndex, 1);
		} else {
			selectedUnits[existingIndex].amount -= 1;
		}
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
				onmousedown={() => initHoldRemove(unit.name)}
				onmouseleave={() => stopHold()}
				onkeypress={(ev) => {
					if (ev.key !== 'Enter') {
						return;
					}
					remove(unit.name);
				}}
			>
				<C.UnitDisplay {...unit} {...rest} />
			</button>
		</li>
	{/each}
</ul>

<style>
	.units-list {
		/* Prevent page shift when adding first unit */
		min-height: calc(var(--unit-size) + var(--bottom-padding) + 1px);
		display: flex;
		flex-flow: row wrap;
		gap: 6px;
	}
	.units-list li button {
		display: block;
		width: 100%;
		height: 100%;
	}
	.units-list:not(.removable) li button {
		cursor: default;
	}
	.units-list:not(.removable) li button:focus {
		outline: none;
	}
</style>
