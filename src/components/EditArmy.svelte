<script lang="ts">
	import { getContext } from 'svelte';
	import { invalidateAll, goto } from '$app/navigation';
	import {
		VALID_HEROES,
		getTotals,
		getCapacity,
		getCcCapacity,
		BANNERS,
		getUnitLevel,
		getCcUnitLevel,
		getEquipmentLevel,
		getPetLevel,
		getHeroLevel,
	} from '~/lib/shared/utils';
	import type { Optional, AppState, Army, ArmyUnit, ArmyEquipment, ArmyPet, Banner, FetchErrors } from '~/lib/shared/types';
	import AddClanCastle from './AddClanCastle.svelte';
	import AddHeroes from './AddHeroes.svelte';
	import C from '~/components';

	type Props = { army?: Army };

	const { army }: Props = $props();
	const app = getContext<AppState>('app');

	// Army state
	let townHall = $state<number>(army?.townHall ?? 16);
	let banner = $state<Banner>(army?.banner ?? BANNERS[Math.floor(Math.random() * BANNERS.length)]);
	let name = $state<string | null>(army?.name ?? null);
	let units = $state<Optional<ArmyUnit, 'id'>[]>(army?.units?.filter((unit) => unit.home === 'armyCamp') ?? []);
	let ccUnits = $state<Optional<ArmyUnit, 'id'>[]>(army?.units?.filter((unit) => unit.home === 'clanCastle') ?? []);
	let equipment = $state<Optional<ArmyEquipment, 'id'>[]>(army?.equipment ?? []);
	let pets = $state<Optional<ArmyPet, 'id'>[]>(army?.pets ?? []);

	// Other state
	let errors = $state<FetchErrors | null>(null);
	let saveDisabled = $derived(!name || name.length < 2 || name.length > 25 || !units.length);
	let showClanCastle = $state<boolean>(ccUnits.length > 0);
	let showHeroes = $state<boolean>(equipment.length > 0 || pets.length > 0);

	const thData = $derived(app.townHalls.find((th) => th.level === townHall));
	const capacity = $derived.by(() => getCapacity(thData));
	const ccCapacity = $derived.by(() => getCcCapacity(thData));
	const housingSpaceUsed = $derived.by(() => getTotals(units));
	const ccHousingSpaceUsed = $derived.by(() => getTotals(ccUnits));

	function addClanCastle() {
		showClanCastle = true;
	}

	function addHeroes() {
		showHeroes = true;
	}

	async function removeClanCastle() {
		if (ccUnits.length) {
			const confirmed = await app.confirm('Removing the clan castle will clear all clan castle units. Remove anyway?');
			if (!confirmed) return;
		}
		ccUnits = [];
		showClanCastle = false;
	}

	async function removeHeroes() {
		if (equipment.length || pets.length) {
			const confirmed = await app.confirm('Removing heroes will clear all equipment and pets. Remove anyway?');
			if (!confirmed) return;
		}
		equipment = [];
		pets = [];
		showHeroes = false;
	}

	function editBanner() {
		const onSave = (newBanner: Banner) => {
			banner = newBanner;
		};
		app.openModal(C.EditBanner, { banner, onSave });
	}

	async function setTownHall(value: number) {
		if (typeof value !== 'number' || value < 1 || value > app.townHalls.length) {
			throw new Error(`Town hall ${value} doesn't exist`);
		}
		if (value < townHall && units.length) {
			const confirmed = await app.confirm('You are selecting a lower town hall, all selections will be cleared. Select anyway?');
			if (confirmed) {
				units = [];
				ccUnits = [];
				equipment = [];
				pets = [];
			} else {
				return;
			}
		}
		townHall = value;
	}

	async function saveArmy() {
		const data = {
			id: army?.id,
			name,
			banner,
			townHall,
			units: [...units, ...ccUnits].map((u) => {
				return { id: u.id, unitId: u.unitId, home: u.home, amount: u.amount };
			}),
			equipment: equipment.map((eq) => {
				return { id: eq.id, equipmentId: eq.equipmentId };
			}),
			pets: pets.map((p) => {
				return { id: p.id, petId: p.petId, hero: p.hero };
			}),
		};
		const response = await fetch('/armies', {
			method: 'POST',
			body: JSON.stringify(data),
			headers: { 'Content-Type': 'application/json' },
		});
		const result = await response.json();
		if (result.errors) {
			errors = result.errors as FetchErrors;
			return;
		}
		if (response.status === 200) {
			if (!army) {
				// Redirect to created army
				goto(`/armies/${result.id}`);
			} else {
				// Back out of editing mode
				await invalidateAll();
				goto(`/armies/${army.id}`);
			}
		} else {
			errors = `${response.status} error`;
		}
	}
</script>

<svelte:head>
	<title>ClashArmies • {army ? 'Edit' : 'Create'} Army</title>
</svelte:head>

<section class="banner">
	<img class="banner-img" src="/clash/banners/{banner}.png" alt="Clash of clans banner artwork" />
	<button class="banner-select-btn" type="button" onclick={editBanner}>
		<svg width="27" height="27" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M3 27C2.175 27 1.469 26.7065 0.882 26.1195C0.295 25.5325 0.001 24.826 0 24V3C0 2.175 0.294 1.469 0.882 0.882C1.47 0.295 2.176 0.001 3 0H24C24.825 0 25.5315 0.294 26.1195 0.882C26.7075 1.47 27.001 2.176 27 3V24C27 24.825 26.7065 25.5315 26.1195 26.1195C25.5325 26.7075 24.826 27.001 24 27H3ZM4.5 21H22.5L16.875 13.5L12.375 19.5L9 15L4.5 21Z"
				fill="white"
			/>
		</svg>
	</button>
</section>

<section class="dashed details">
	<div>
		<h2>Army details</h2>
		<C.Fieldset label="Army name*:" htmlName="name" style="padding: 0 8px" --input-width="250px">
			<C.Input bind:value={name} maxlength={25} />
		</C.Fieldset>
		<C.Fieldset label="Town hall:" htmlName="town-all" style="padding: 0 8px; margin-top: 16px;" --input-width="100%">
			<div class="town-halls-grid">
				{#each app.townHalls as th}
					{@const isSelected = townHall === th.level}
					{@const btnAttributes = { title: isSelected ? `Town hall ${th.level} is already selected` : `Town hall ${th.level}`, disabled: isSelected }}
					<C.TownHall onclick={() => setTownHall(th.level)} level={th.level} {...btnAttributes} --width="100%" />
				{/each}
			</div>
		</C.Fieldset>
	</div>
</section>

<section class="dashed units">
	<div>
		<div class="title">
			<h2>
				<img src="/clash/ui/army-camp.png" alt="Clash of clans army camp" />
				Unit selector
			</h2>
			<C.UnitTotals used={housingSpaceUsed} {capacity} />
		</div>
		<C.UnitsList bind:selectedUnits={units} unitsRemovable />
		<div class="picker-container">
			<C.UnitsPicker type="Troop" {capacity} {getUnitLevel} bind:selectedUnits={units} housedIn="armyCamp" selectedTownHall={townHall} />
		</div>
		{#if capacity.spells > 0}
			<div class="picker-container">
				<C.UnitsPicker type="Spell" {capacity} {getUnitLevel} bind:selectedUnits={units} housedIn="armyCamp" selectedTownHall={townHall} />
			</div>
		{/if}
		{#if capacity.sieges > 0}
			<div class="picker-container">
				<C.UnitsPicker type="Siege" {capacity} {getUnitLevel} bind:selectedUnits={units} housedIn="armyCamp" selectedTownHall={townHall} />
			</div>
		{/if}
	</div>
</section>

<section class="dashed units cc">
	{#if thData && thData.maxCc !== null && showClanCastle}
		<div>
			<div class="title">
				<h2>
					<img src="/clash/ui/clan-castle.png" alt="Clash of clans clan castle" />
					Clan castle
					<C.ActionButton theme="danger" onclick={removeClanCastle} class="cc-remove-btn">Remove</C.ActionButton>
				</h2>
				<C.UnitTotals used={ccHousingSpaceUsed} capacity={ccCapacity} showTime={false} />
			</div>
			<C.UnitsList bind:selectedUnits={ccUnits} unitsRemovable />
			<div class="picker-container">
				<C.UnitsPicker
					type="Troop"
					capacity={ccCapacity}
					getUnitLevel={getCcUnitLevel}
					bind:selectedUnits={ccUnits}
					housedIn="clanCastle"
					selectedTownHall={townHall}
				/>
			</div>
			{#if ccCapacity.spells > 0}
				<div class="picker-container">
					<C.UnitsPicker
						type="Spell"
						capacity={ccCapacity}
						getUnitLevel={getCcUnitLevel}
						bind:selectedUnits={ccUnits}
						housedIn="clanCastle"
						selectedTownHall={townHall}
					/>
				</div>
			{/if}
			{#if ccCapacity.sieges > 0}
				<div class="picker-container">
					<C.UnitsPicker
						type="Siege"
						capacity={ccCapacity}
						getUnitLevel={getCcUnitLevel}
						bind:selectedUnits={ccUnits}
						housedIn="clanCastle"
						selectedTownHall={townHall}
					/>
				</div>
			{/if}
		</div>
	{:else}
		<AddClanCastle onClick={addClanCastle} selectedTownHall={townHall} />
	{/if}
</section>

<section class="dashed units heroes">
	{#if thData && thData.maxBarbarianKing !== null && showHeroes}
		<div>
			<div class="title">
				<h2>
					<img src="/clash/heroes/Barbarian King.png" alt="Clash of clans barbarian king hero" />
					Heroes
					<C.ActionButton theme="danger" onclick={removeHeroes} class="cc-remove-btn">Remove</C.ActionButton>
				</h2>
			</div>
			{#each VALID_HEROES as hero}
				{#if thData && getHeroLevel(hero, { th: thData }) !== -1}
					<div class="hero-picker-container">
						<C.HeroPicker {hero} bind:selectedEquipment={equipment} bind:selectedPets={pets} selectedTownHall={townHall} {getEquipmentLevel} {getPetLevel} />
					</div>
				{/if}
			{/each}
		</div>
	{:else}
		<AddHeroes onClick={addHeroes} selectedTownHall={townHall} />
	{/if}
</section>

{#if errors}
	<div class="errors">
		<C.Errors {errors} />
	</div>
{/if}

<div class="army-controls">
	<C.Button asLink href={army ? `/armies/${army.id}` : '/armies'}>Cancel</C.Button>
	<C.Button onClick={saveArmy} disabled={saveDisabled}>{army ? 'Save' : 'Create'}</C.Button>
</div>

<style>
	/* BANNER */
	.banner {
		overflow: hidden;
		position: relative;
		border-radius: 8px;
		width: 100%;
	}

	.banner-img {
		display: block;
		object-fit: cover;
		aspect-ratio: 1920 / 800;
		max-height: 350px;
		min-height: 175px;
		height: 100%;
		width: 100%;
	}

	.banner-select-btn {
		border: 1px dotted var(--grey-100);
		background-color: var(--grey-600);
		box-shadow: rgba(0, 0, 0, 1) 0px 10px 50px 4px;
		transition: background-color 0.2s ease-in-out;
		display: flex;
		justify-content: center;
		align-items: center;
		position: absolute;
		border-radius: 6px;
		padding: 0.75em;
		bottom: 1em;
		right: 1em;
	}
	.banner-select-btn:hover {
		background-color: var(--grey-500);
	}

	/* DETAILS */
	.details {
		margin-top: 48px;
	}
	.details > div {
		padding: 0 24px 24px 24px;
	}
	.town-halls-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
		width: 100%;
		gap: 8px;
	}
	.town-halls-grid :global(.town-hall:disabled) {
		filter: grayscale(1);
		border: 1px dashed var(--primary-400);
	}

	/* DASHED STUFF */
	.units :global(.totals),
	.dashed,
	.dashed h2 {
		background-color: var(--grey-800);
		border: 1px dashed var(--grey-500);
		border-radius: 8px;
	}
	.units :global(.totals) {
		margin-bottom: 16px;
	}
	.dashed > div {
		margin-top: -12px;
	}
	.dashed h2 {
		border-radius: 4px;
		margin-bottom: 16px;
		padding: 6px 8px;
	}
	.dashed h2 {
		display: inline-flex;
		align-items: center;
		gap: 0.5em;
		font-family: 'Poppins', sans-serif;
		font-size: var(--fs);
		line-height: var(--fs-lh);
		color: var(--grey-100);
		font-weight: bold;
		letter-spacing: 2px;
		text-transform: uppercase;
	}
	.dashed h2 img {
		flex-shrink: 0;
		max-height: 24px;
		height: 100%;
		width: auto;
	}

	.units :global(.units-list) {
		border-bottom: 1px dashed var(--grey-500);
		margin-bottom: 24px;
		padding: 0 32px var(--bottom-padding) 32px;
	}

	/* ARMY CONTROLS */
	.army-controls {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
	}
	.army-controls:not(:empty) {
		margin-top: 24px;
	}

	/* ERRORS */
	.errors {
		margin-top: 24px;
	}

	/* UNITS */
	.units {
		--unit-size: 70px;
		--unit-amount-size: 16px;
		--unit-lvl-size: 13px;
		--bottom-padding: 16px;
		margin-top: 32px;
	}
	.units:global(:has(> .not-added)) {
		margin-top: 24px;
	}
	.units .title {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 24px;
	}
	.picker-container,
	.hero-picker-container {
		padding: 0 32px;
	}
	.picker-container:not(:last-child) {
		padding-bottom: 16px;
	}
	.hero-picker-container:not(:last-child) {
		border-bottom: 1px dashed var(--grey-500);
	}
	.units > div {
		padding-bottom: 24px;
	}
	.units.heroes > div {
		padding-bottom: 0;
	}
	.units.heroes h2 {
		margin-bottom: 0;
	}
	.units :global(h3) {
		font-size: var(--fs);
		line-height: var(--fs-lh);
		margin-bottom: 8px;
	}

	.cc {
		background-color: var(--grey-800);
	}
	.cc:has(:global(> .not-added)) {
		display: flex;
		flex-flow: column;
		align-items: center;
		justify-content: center;
		margin-top: 24px;
	}

	:global(.cc-remove-btn) {
		margin-left: 0.25em;
	}

	@media (max-width: 850px) {
		.details {
			margin-top: 36px;
		}
		.units {
			--unit-size: 60px;
			--unit-amount-size: 14px;
			--unit-lvl-size: 11px;
		}
		.errors {
			margin-top: 16px;
		}
		.army-controls {
			margin-top: 16px;
		}
	}

	@media (max-width: 650px) {
		.units .title {
			display: inline-flex;
			flex-flow: column nowrap;
			gap: 0px;
		}
		.units .title > * {
			margin: 0;
			width: 100%;
		}
		.units:not(.heroes) h2 {
			border-bottom: none;
			padding-bottom: 0;
		}
		.units :global(.totals) {
			padding-top: 12px;
			border-radius: 0;
			border-top: none;
			width: 100%;
		}
	}

	@media (max-width: 475px) {
		.units :global(.totals) {
			display: grid;
			grid-template-columns: repeat(2, min-content);
		}
		.units :global(.units-list) {
			padding: 0 24px var(--bottom-padding) 24px;
		}
		.details > div {
			padding: 0 16px 24px 16px;
		}
		.units .title {
			padding: 0 16px;
		}
		.picker-container,
		.hero-picker-container {
			padding: 0 24px;
		}
	}

	@media (max-width: 400px) {
		.units {
			--unit-amount-size: 13px;
			--unit-lvl-size: 10.5px;
		}
	}

	@media (max-width: 365px) {
		.dashed h2 {
			flex-flow: row wrap;
			row-gap: 0.75em;
		}
		:global(.cc-remove-btn) {
			margin-left: 0;
		}
	}
</style>
