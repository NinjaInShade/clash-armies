<script lang="ts">
	import type { AppState, HeroType, ArmyEquipment, ArmyPet } from '$types';
	import { getContext } from 'svelte';
	import HeroDisplay from './HeroDisplay.svelte';
	import EquipmentDisplay from './EquipmentDisplay.svelte';
	import PetDisplay from './PetDisplay.svelte';

	type Props = {
		hero: HeroType;
		/** All selected equipment across all heroes */
		selectedEquipment: ArmyEquipment[];
		/** All selected pets across all heroes */
		selectedPets: ArmyPet[];
		selectedTownHall: number;
	};
	const { hero, selectedEquipment, selectedPets, selectedTownHall }: Props = $props();

	// Selected equipment/pets just for this hero
	const app = getContext<AppState>('app');
	const _selectedEquipment = $derived(selectedEquipment.filter((eq) => eq.hero === hero));
	const _selectedPets = $derived(selectedPets.filter((p) => p.hero === hero));
	const thData = $derived(app.townHalls.find((th) => th.level === selectedTownHall));
</script>

<div class="hero-display-full">
	<HeroDisplay name={hero} />
	<div class="equipped">
		<div class="equipment">
			{#each new Array(2) as _, index}
				{@const selected = _selectedEquipment[index]}
				{#if selected}
					<EquipmentDisplay {...selected} />
				{:else}
					<div class="selected-placeholder" title="No equipment selected for this slot"></div>
				{/if}
			{/each}
		</div>
		{#if thData && thData.maxPetHouse !== null}
			<div class="pet">
				{#if _selectedPets[0]}
					<PetDisplay {..._selectedPets[0]} />
				{:else}
					<div class="selected-placeholder" title="No pet selected"></div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.selected-placeholder {
		background-color: #2f2f2f;
		border: 1px dashed var(--grey-500);
		height: var(--unit-size, 100%);
		width: var(--unit-size, 100%);
		border-radius: 6px;
	}

	.hero-display-full {
		display: flex;
		align-items: flex-start;
		gap: 8px;
	}

	.equipped {
		display: flex;
		flex-flow: column nowrap;
		align-items: flex-start;
		gap: 4px;
	}

	.equipment {
		display: flex;
		gap: 4px;
	}

	.equipment :global(> *) {
		flex: 1 0 0px;
	}
</style>
