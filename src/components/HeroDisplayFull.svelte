<script lang="ts">
	import type { HeroType } from '$types';
	import HeroDisplay from './HeroDisplay.svelte';
	import EquipmentDisplay from './EquipmentDisplay.svelte';
	import PetDisplay from './PetDisplay.svelte';
	import type { ArmyModel } from '$models';

	type Props = {
		hero: HeroType;
		model: ArmyModel;
	};
	const { hero, model }: Props = $props();

	// Selected equipment/pets just for this hero
	const _selectedEquipment = $derived(model.equipment.filter((eq) => eq.info.hero === hero));
	const _selectedPets = $derived(model.pets.filter((p) => p.hero === hero));
</script>

<div class="hero-display-full">
	<HeroDisplay name={hero} />
	<div class="equipped">
		<div class="equipment">
			{#each new Array(2) as _, index}
				{@const selected = _selectedEquipment[index]}
				{#if selected}
					<EquipmentDisplay name={selected.info.name} />
				{:else}
					<div class="selected-placeholder" title="No equipment selected for this slot"></div>
				{/if}
			{/each}
		</div>
		{#if model.thData.maxPetHouse !== null}
			<div class="pet">
				{#if _selectedPets[0]}
					<PetDisplay name={_selectedPets[0].info.name} />
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
