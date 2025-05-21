<script lang="ts">
	import { getContext } from 'svelte';
	import type { AppState, HeroType, Pet } from '$types';
	import HeroDisplay from './HeroDisplay.svelte';
	import ActionButton from './ActionButton.svelte';
	import EquipmentDisplay from './EquipmentDisplay.svelte';
	import PetDisplay from './PetDisplay.svelte';
	import AddHero from './AddHero.svelte';
	import { EquipmentModel, ArmyModel, PetModel } from '$models';

	type Props = {
		model: ArmyModel;
		hero: HeroType;
		shownHeroes: HeroType[];
	};
	const { model, hero, shownHeroes = $bindable() }: Props = $props();
	const app = getContext<AppState>('app');

	// Selected equipment/pets just for this hero
	const _selectedEquipment = $derived(model.equipment.filter((eq) => eq.info.hero === hero));
	const _selectedPets = $derived(model.pets.filter((p) => p.hero === hero));
	const allEquipment = $derived(app.equipment.filter((eq) => eq.hero === hero));
	const sortedEquipment = $derived([...allEquipment.filter((eq) => !eq.epic), ...allEquipment.filter((eq) => eq.epic)]);
	const shown = $derived(shownHeroes.includes(hero));

	function getEquipmentTitle(level: number, name: string, selected: EquipmentModel[]) {
		if (level === -1) {
			return `This equipment is unable to to be used at town hall ${model.townHall}`;
		}
		if (selected.length >= 2) {
			return `All available equipment slots have been used up for the ${hero.toLowerCase()}`;
		}
		if (equipmentEquipped(name, selected)) {
			return `This equipment is already equipped`;
		}
		return undefined;
	}

	function getPetTitle(level: number, name: string, selected: PetModel[]) {
		if (level === -1) {
			return `This pet is unable to be used at town hall ${model.townHall}`;
		}
		const _selected = selected.filter((p) => p.hero === hero);
		if (_selected.length >= 1) {
			return `All available pet slots have been equipped for the ${hero.toLowerCase()}`;
		}
		if (petEquipped(name, selected)) {
			const equippedHero = selected.find((p) => p.info.name === name)?.hero ?? '';
			return `This pet has already been equipped on the ${equippedHero.toLowerCase()}.\n\nClicking the replace button (bottom right) will clear it from that hero and equip it on this one.`;
		}
		return undefined;
	}

	/** Returns if this equipment is equipped for this hero */
	function equipmentEquipped(name: string, selected: EquipmentModel[]) {
		return selected.find((eq) => eq.info.name === name) !== undefined;
	}

	/** Returns true if this pet is equipped across *all* heroes */
	function petEquipped(name: string, selected: PetModel[]) {
		return selected.find((p) => p.info.name === name) !== undefined;
	}

	function addHero() {
		shownHeroes.push(hero);
	}

	async function removeHero() {
		const removeEq = model.equipment.filter((eq) => eq.info.hero === hero).map((eq) => eq.info.name);
		const removePets = model.pets.filter((pet) => pet.hero === hero).map((pet) => pet.info.name);
		if (removeEq.length || removePets.length) {
			const confirmed = await app.confirm("Removing this hero will clear it's equipment and pets. Remove anyway?");
			if (!confirmed) return;
		}
		for (const eq of removeEq) {
			model.removeEquipment(eq);
		}
		for (const pet of removePets) {
			model.removePet(pet);
		}
		const heroIndex = shownHeroes.findIndex((h) => h === hero);
		shownHeroes.splice(heroIndex, 1);
	}

	async function replacePet(pet: Pet) {
		const nameLower = pet.name.toLowerCase();
		const selectedPetHero = model.pets.find((p) => p.info.name === pet.name)?.hero.toLowerCase();
		if (!selectedPetHero) {
			throw new Error(`Pet "${pet.name}" does not exist in this army`);
		}
		const confirmed = await app.confirm(`Do you wish to move the ${nameLower} pet (currently equipped on the ${selectedPetHero}) to this hero?`);
		if (!confirmed) {
			return;
		}
		model.replacePet(pet.name, hero);
	}
</script>

<div class="hero {hero.replaceAll(' ', '-').toLowerCase()}" class:shown>
	{#if shown}
		<div class="hero-container">
			<HeroDisplay name={hero} level={ArmyModel.getMaxHeroLevel(hero, model.townHall, app)} />
			<ActionButton style="margin-top: 8px" theme="danger" onclick={removeHero}>Remove</ActionButton>
		</div>
		<div class="vertical-separator"></div>
	{/if}
	<div class="selection">
		{#if shown}
			<div class="equipment">
				<ul class="selected-equipment">
					{#each new Array(2) as _, index}
						{@const selected = _selectedEquipment[index]}
						{#if selected}
							<li>
								<button type="button" onclick={() => model.removeEquipment(selected.info.name)}>
									<EquipmentDisplay name={selected.info.name} amount={1} />
								</button>
							</li>
						{:else}
							<li class="selected-placeholder"></li>
						{/if}
					{/each}
				</ul>
				<ul class="picker-list">
					{#each sortedEquipment as equipment}
						{@const level = EquipmentModel.getMaxLevel(equipment.name, model.townHall, model.gameData)}
						{@const title = getEquipmentTitle(level, equipment.name, _selectedEquipment)}
						<li>
							<button
								type="button"
								disabled={_selectedEquipment.length >= 2 || equipmentEquipped(equipment.name, _selectedEquipment) || level === -1}
								onclick={() => model.addEquipment(equipment)}
							>
								<EquipmentDisplay name={equipment.name} {level} {title} />
							</button>
						</li>
					{/each}
				</ul>
			</div>
			{#if model.thData && model.thData.maxPetHouse !== null}
				<div class="pets">
					<div class="selected-pet">
						{#if _selectedPets[0]}
							<li>
								<button type="button" onclick={() => model.removePet(_selectedPets[0].info.name)}>
									<PetDisplay name={_selectedPets[0].info.name} amount={1} />
								</button>
							</li>
						{:else}
							<div class="selected-placeholder"></div>
						{/if}
					</div>
					<ul class="picker-list">
						{#each app.pets as pet}
							{@const level = PetModel.getMaxLevel(pet.name, model.townHall, model.gameData)}
							{@const title = getPetTitle(level, pet.name, model.pets)}
							{@const equippedHero = model.pets.find((p) => p.info.name === pet.name)?.hero}
							{@const equippedOnDifferentHero = equippedHero !== undefined && equippedHero !== hero}
							<li>
								<button
									type="button"
									class:visually-disabled={equippedOnDifferentHero}
									disabled={!equippedOnDifferentHero && (_selectedPets.length >= 1 || petEquipped(pet.name, model.pets) || level === -1)}
									onclick={() => (equippedOnDifferentHero ? replacePet(pet) : model.addPet(pet, hero))}
								>
									<PetDisplay name={pet.name} {level} {title} />
								</button>
								{#if _selectedPets.length === 0 && equippedOnDifferentHero}
									<button type="button" class="replace-pet" onclick={() => replacePet(pet)} aria-label="Replace pet">
										<svg width="14" height="10" viewBox="0 0 13 9" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path
												d="M2.08936 4.39634L0.101876 6.39097C-0.0339588 6.53395 -0.0339588 6.75558 0.101876 6.89856L2.08936 8.89319C2.31098 9.12197 2.69704 8.95754 2.69704 8.64297V7.35611H6.99372C7.38693 7.35611 7.70864 7.0344 7.70864 6.64119C7.70864 6.24798 7.38693 5.92627 6.99372 5.92627H2.69704V4.64656C2.69704 4.32484 2.31098 4.16756 2.08936 4.39634ZM12.4629 2.10144L10.4754 0.106805C10.2538 -0.121969 9.86771 0.0424625 9.86771 0.357028V1.63674H5.56388C5.17067 1.63674 4.84896 1.95845 4.84896 2.35166C4.84896 2.74487 5.17067 3.06658 5.56388 3.06658H9.86056V4.34629C9.86056 4.66801 10.2466 4.82529 10.4682 4.59651L12.4557 2.60188C12.5987 2.46605 12.5987 2.23727 12.4629 2.10144Z"
												fill="#FCEFEF"
											/>
										</svg>
									</button>
								{/if}
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		{:else}
			{@const maxHeroesSelected = shownHeroes.length >= 4}
			<AddHero
				{hero}
				onClick={addHero}
				disabled={maxHeroesSelected}
				title={maxHeroesSelected ? `Cannot have more than 4 heroes\nRemove another hero to add the ${hero.toLowerCase()}` : ''}
			/>
		{/if}
	</div>
</div>

<style>
	.hero {
		--hero-height: 110px;
		display: flex;
	}
	.hero:not(.shown) .selection {
		justify-content: center;
	}
	.selection {
		flex: 1 0 0px;
	}
	.selection,
	.equipment,
	.pets {
		display: flex;
	}
	.vertical-separator {
		border-left: 1px dashed var(--grey-500);
		margin: 0 24px;
		width: 1px;
	}
	.selected-equipment {
		display: flex;
		flex-flow: column nowrap;
		margin-right: 16px;
		gap: 6px;
	}
	.selected-pet {
		display: flex;
		flex-flow: column nowrap;
		margin: 0 16px 0 40px;
		gap: 6px;
	}
	.selected-placeholder {
		background-color: #2f2f2f;
		border: 1px dashed var(--grey-500);
		height: var(--unit-size, 100%);
		width: var(--unit-size, 100%);
		border-radius: 6px;
	}
	.picker-list {
		--max-cols: 3;
		--max-rows: 2;
		max-width: calc((var(--unit-size) * var(--max-cols)) + (var(--gap) * (var(--max-cols) - 1)) + 24px);
		align-self: flex-start;
		width: 100%;
	}
	.pets .picker-list {
		--max-cols: 5;
	}
	.selected-equipment li,
	.selected-pet li {
		width: var(--unit-size);
		height: var(--unit-size);
		position: relative;
	}
	.replace-pet {
		position: absolute;
		bottom: 6px;
		right: 6px;
		padding: 3px 4px;
		background-color: var(--grey-100);
		border-radius: 4px;
	}
	.replace-pet path {
		fill: var(--grey-900);
	}
	.replace-pet:hover {
		background-color: var(--grey-300);
	}
	.replace-pet svg {
		display: block;
	}
	.hero-container {
		flex-shrink: 0;
	}
	.hero-container,
	.picker-list,
	.selected-equipment,
	.selected-pet {
		margin-top: 24px;
		margin-bottom: 24px;
	}

	@media (max-width: 850px) {
		.hero {
			--hero-height: 95px;
		}
		.vertical-separator {
			margin: 0 16px;
		}
	}

	@media (max-width: 800px) {
		.selection {
			flex-flow: column nowrap;
		}
		.selected-pet,
		.pets .picker-list {
			margin-top: 0;
		}
		.selected-pet {
			margin-left: 0;
		}
	}

	@media (max-width: 475px) {
		.selection {
			flex: 1 0 0px;
		}
		.equipment,
		.pets,
		.hero {
			flex-flow: column nowrap;
		}
		.selected-equipment,
		.selected-pet {
			flex-flow: row nowrap;
			margin-right: 0;
			margin-top: 16px;
			margin-bottom: 0;
		}
		.selected-pet,
		.pets .picker-list,
		.picker-list {
			margin-top: 8px;
			--max-cols: 6;
			--max-rows: 3;
		}
		.vertical-separator {
			display: none;
		}
		.hero-container {
			margin: 16px 16px 0 0;
			align-self: flex-start;
		}
	}
</style>
