<script lang="ts">
	import { getContext } from 'svelte';
	import { invalidateAll, goto } from '$app/navigation';
	import { VALID_HEROES, GUIDE_TEXT_CHAR_LIMIT, ARMY_TAGS, MAX_ARMY_TAGS } from '$shared/utils';
	import { HTTPError, type APIErrors } from '$shared/http';
	import type { AppState, Banner } from '$types';
	import { ArmyModel, type Army } from '$models';
	import ImportFromLink from './ImportFromLink.svelte';
	import EditBanner from './EditBanner.svelte';
	import Fieldset from './Fieldset.svelte';
	import Input from './Input.svelte';
	import TownHall from './TownHall.svelte';
	import ActionButton from './ActionButton.svelte';
	import UnitTotals from './UnitTotals.svelte';
	import UnitsList from './UnitsList.svelte';
	import UnitsPicker from './UnitsPicker.svelte';
	import OfferClanCastle from './AddClanCastle.svelte';
	import OfferHeroes from './AddHeroes.svelte';
	import OfferGuide from './AddGuide.svelte';
	import HeroPicker from './HeroPicker.svelte';
	import GuideEditor from './GuideEditor.svelte';
	import Errors from './Errors.svelte';
	import Button from './Button.svelte';

	type Props = { army?: Army };

	const { army }: Props = $props();
	const app = getContext<AppState>('app');
	const model = new ArmyModel(app, army);

	// Other state
	let errors = $state<APIErrors | null>(null);
	let saveDisabled = $derived(!model.name || model.name.length < 2 || model.name.length > 25 || !model.units.length);
	let showClanCastle = $state(model.ccUnits.length > 0);
	let shownHeroes = $state(model.id ? VALID_HEROES.filter((hero) => model.hasHero(hero)) : null);

	function addClanCastle() {
		showClanCastle = true;
	}

	function addHeroes() {
		shownHeroes = getDefaultHeroes(model.townHall);
	}

	function addGuide() {
		model.addGuide();
	}

	function getDefaultHeroes(thLvl: number) {
		return VALID_HEROES.filter((hero) => {
			return ArmyModel.getMaxHeroLevel(hero, thLvl, app) !== -1;
		}).slice(0, 4);
	}

	async function removeClanCastle() {
		if (model.ccUnits.length) {
			const confirmed = await app.confirm('Removing the clan castle will clear all clan castle units. Remove anyway?');
			if (!confirmed) return;
		}
		model.ccUnits = [];
		showClanCastle = false;
	}

	async function removeHeroes() {
		if (model.equipment.length || model.pets.length) {
			const confirmed = await app.confirm('Removing heroes will clear all equipment and pets. Remove anyway?');
			if (!confirmed) return;
		}
		model.equipment = [];
		model.pets = [];
		shownHeroes = null;
	}

	async function removeGuide() {
		if (!model.guide) {
			return;
		}
		if (model.guide.textContent || model.guide.youtubeUrl) {
			const confirmed = await app.confirm('Removing the guide will clear already written text and youtube URL. Remove anyway?');
			if (!confirmed) return;
		}
		model.removeGuide();
	}

	async function importUnits() {
		const importedModel = await app.openModalAsync<ArmyModel>(ImportFromLink);
		if (!importedModel) return;

		if (model.units.length || model.ccUnits.length || model.equipment.length || model.pets.length) {
			const confirmed = await app.confirm('Importing these units will clear existing ones. Import anyway?');
			if (!confirmed) return;
		}

		model.units = importedModel.units;
		model.ccUnits = importedModel.ccUnits;
		model.pets = importedModel.pets;
		model.equipment = importedModel.equipment;

		showClanCastle = importedModel.ccUnits.length > 0;

		const importedHeroes = VALID_HEROES.filter((hero) => importedModel.hasHero(hero));
		if (importedHeroes.length) {
			shownHeroes = importedHeroes;
		} else {
			shownHeroes = null;
		}
	}

	function editBanner() {
		app.openModal(EditBanner, {
			banner: model.banner,
			onSave(newBanner: Banner) {
				model.banner = newBanner;
			},
		});
	}

	async function setTownHall(value: number) {
		if (typeof value !== 'number' || value < 1 || value > app.townHalls.length) {
			throw new Error(`Town hall ${value} doesn't exist`);
		}
		if (value < model.townHall && (model.units.length || model.ccUnits.length || model.equipment.length || model.pets.length)) {
			const confirmed = await app.confirm('You are selecting a lower town hall, all selections will be cleared. Select anyway?');
			if (confirmed) {
				model.units = [];
				model.ccUnits = [];
				model.equipment = [];
				model.pets = [];
				shownHeroes = shownHeroes ? getDefaultHeroes(value) : null;
			} else {
				return;
			}
		}
		model.townHall = value;
	}

	function toggleTag(tag: string) {
		if (model.tags.includes(tag)) {
			const idx = model.tags.indexOf(tag);
			model.tags.splice(idx, 1);
		} else {
			model.tags.push(tag);
		}
	}

	async function onKeyDown(ev: KeyboardEvent) {
		const key = ev.key.toLowerCase();
		const mod = ev.ctrlKey || ev.metaKey;
		if (mod && key === 's') {
			ev.preventDefault();
			if (!saveDisabled) {
				await saveArmy();
			}
		}
	}

	async function saveArmy() {
		const data = model.getSaveData();

		let id: number;
		try {
			id = await app.http.post<number>('/api/armies', data);
		} catch (err) {
			if (err instanceof HTTPError) {
				errors = err.errors ?? err.message;
			}
			return;
		}

		if (!model.id) {
			// Redirect to created army
			await goto(`/armies/${id}`);
		} else {
			// Back out of editing mode
			await invalidateAll();
			await goto(`/armies/${model.id}`);
		}
	}
</script>

<svelte:head>
	<title>ClashArmies • Army creator</title>
</svelte:head>

<svelte:window onkeydown={onKeyDown} />

<section class="banner">
	<picture>
		<source srcset="/banners/{model.banner}.webp" media="(max-width: 900px)" />
		<img class="banner-img" src="/banners/{model.banner}_large.webp" alt="Clash of clans banner artwork" />
	</picture>
	<button class="banner-select-btn" type="button" onclick={editBanner} aria-label="Opens up army banner selection modal">
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
		<div class="title">
			<h2>
				<img src="/ui/hammer-and-saw.webp" alt="Hammer and saw crossed over each other" />
				Army
				<ActionButton theme="primary-dark" onclick={importUnits} class="title-action-btn">
					<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path
							fill-rule="evenodd"
							clip-rule="evenodd"
							d="M6.44941 5.8225L8.71951 3.5531L9.70931 4.5429L5.74941 8.5028L1.78951 4.5429L2.77931 3.5531L5.04941 5.8225V0H6.5L6.44941 5.8225ZM0.149414 7.8H1.54941V10.6H9.94941V7.8H11.3494V10.6C11.3494 11.37 10.7194 12 9.94941 12H1.54941C0.779414 12 0.149414 11.3259 0.149414 10.6V7.8Z"
							fill="currentColor"
						/>
					</svg>
					Import
				</ActionButton>
			</h2>
		</div>
		<Fieldset label="Army name*:" htmlName="name" style="padding: 0 8px" --input-width="250px">
			<Input bind:value={model.name} maxlength={25} />
		</Fieldset>
		<Fieldset label="Town hall:" htmlName="town-all" style="padding: 0 8px; margin-top: 16px;" --input-width="100%">
			<div class="town-halls-grid">
				{#each app.townHalls as th}
					{@const isSelected = model.townHall === th.level}
					{@const btnAttributes = { title: isSelected ? `Town hall ${th.level} is already selected` : `Town hall ${th.level}`, disabled: isSelected }}
					<TownHall onclick={() => setTownHall(th.level)} level={th.level} {...btnAttributes} --width="100%" />
				{/each}
			</div>
		</Fieldset>
		<Fieldset label="Tags (max {MAX_ARMY_TAGS}):" htmlName="tags" style="padding: 0 8px; margin-top: 16px;" --input-width="100%">
			<ul class="army-tags">
				{#each ARMY_TAGS as tag}
					{@const active = model.tags.includes(tag)}
					<li>
						<button class="army-tag" class:active disabled={!active && model.tags.length >= MAX_ARMY_TAGS} onclick={() => toggleTag(tag)}>
							{tag}
						</button>
					</li>
				{/each}
			</ul>
		</Fieldset>
	</div>
</section>

<section class="dashed units">
	<div>
		<div class="title">
			<h2>
				<img src="/ui/army-camp.webp" alt="Clash of clans army camp" />
				Army camp
			</h2>
			<UnitTotals {model} housedIn="armyCamp" />
		</div>
		<UnitsList {model} housedIn="armyCamp" unitsRemovable />
		<div class="picker-container">
			<UnitsPicker {model} type="Troop" housedIn="armyCamp" />
		</div>
		{#if model.capacity.spells > 0}
			<div class="picker-container">
				<UnitsPicker {model} type="Spell" housedIn="armyCamp" />
			</div>
		{/if}
		{#if model.capacity.sieges > 0}
			<div class="picker-container">
				<UnitsPicker {model} type="Siege" housedIn="armyCamp" />
			</div>
		{/if}
	</div>
</section>

<section class="dashed units cc">
	{#if model.thData && model.thData.maxCc !== null && showClanCastle}
		<div>
			<div class="title">
				<h2>
					<img src="/ui/clan-castle.webp" alt="Clash of clans clan castle" />
					Clan castle
					<ActionButton theme="danger" onclick={removeClanCastle} class="title-action-btn">Remove</ActionButton>
				</h2>
				<UnitTotals {model} housedIn="clanCastle" />
			</div>
			<UnitsList {model} housedIn="clanCastle" unitsRemovable />
			<div class="picker-container">
				<UnitsPicker {model} type="Troop" housedIn="clanCastle" />
			</div>
			{#if model.ccCapacity.spells > 0}
				<div class="picker-container">
					<UnitsPicker {model} type="Spell" housedIn="clanCastle" />
				</div>
			{/if}
			{#if model.ccCapacity.sieges > 0}
				<div class="picker-container">
					<UnitsPicker {model} type="Siege" housedIn="clanCastle" />
				</div>
			{/if}
		</div>
	{:else}
		<OfferClanCastle {model} onClick={addClanCastle} />
	{/if}
</section>

<section class="dashed units heroes">
	{#if model.thData && model.thData.maxBarbarianKing !== null && shownHeroes}
		<div>
			<div class="title">
				<h2>
					<img src="/heroes/Barbarian King.webp" alt="Clash of clans barbarian king hero" />
					Heroes
					<ActionButton theme="danger" onclick={removeHeroes} class="title-action-btn">Remove</ActionButton>
				</h2>
			</div>
			{#each VALID_HEROES as hero}
				{#if model.thData && ArmyModel.getMaxHeroLevel(hero, model.townHall, model.gameData) !== -1}
					<div class="hero-picker-container">
						<HeroPicker {model} {hero} bind:shownHeroes />
					</div>
				{/if}
			{/each}
		</div>
	{:else}
		<OfferHeroes {model} onClick={addHeroes} />
	{/if}
</section>

<section class="dashed units guide">
	{#if model.guide}
		<div>
			<div class="title">
				<h2>
					<img src="/ui/bb-duel.webp" alt="Clash of clans builder base swords" />
					Guide
					<ActionButton theme="danger" onclick={removeGuide} class="title-action-btn">Remove</ActionButton>
				</h2>
			</div>
			<div class="guide-edit">
				<GuideEditor bind:text={model.guide.textContent} charLimit={GUIDE_TEXT_CHAR_LIMIT} mode="edit" />
				<Fieldset label="Video guide" htmlName="youtubeUrl" style="margin-top: 1em">
					<Input bind:value={model.guide.youtubeUrl} placeholder="https://youtube.com/..." />
				</Fieldset>
			</div>
		</div>
	{:else}
		<OfferGuide onClick={addGuide} />
	{/if}
</section>

<div class="errors">
	<Errors {errors} />
</div>

<div class="army-controls">
	<Button asLink href={model.id ? `/armies/${model.id}` : '/armies'}>Cancel</Button>
	<Button onClick={saveArmy} disabled={saveDisabled}>{model.id ? 'Save' : 'Create'}</Button>
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
		margin-top: 32px;
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
	.errors:not(:empty) {
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

	.guide-edit {
		padding: 0 32px;
	}

	:global(.title-action-btn) {
		margin-left: 0.25em;
	}

	.army-tags {
		display: flex;
		flex-flow: row wrap;
		align-items: center;
		gap: 8px;

		& .army-tag {
			background-color: var(--grey-700);
			border: 1px dashed var(--grey-400);
			color: var(--grey-400);
			font-size: var(--fs);
			line-height: var(--fs-lh);
			font-weight: 500;
			border-radius: 4px;
			padding: 4px 10px;

			&:hover:not(:disabled),
			&:focus-visible {
				outline: none;
				background-color: var(--grey-850);
			}

			&.active {
				border: 1px dashed #e0a153;
				background-color: hsl(33, 15%, 26%);
				color: #e0a153;

				&:hover:not(:disabled),
				&:focus-visible {
					outline: none;
					background-color: hsl(33, 15%, 22%);
				}
			}
		}
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
		.errors:not(:empty) {
			margin-top: 16px;
		}
		.army-controls {
			margin-top: 16px;
		}
	}

	@media (max-width: 750px) {
		.units .title {
			display: inline-flex;
			flex-flow: column nowrap;
			gap: 0px;
		}
		.units:not(.guide) .title > * {
			margin: 0;
			width: 100%;
		}
		.units:not(.heroes):not(.guide) h2 {
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
		.guide-edit {
			--input-width: 100%;
			padding: 0 24px;
		}
	}

	@media (max-width: 400px) {
		.units {
			--unit-amount-size: 13px;
			--unit-lvl-size: 10.5px;
		}
	}

	@media (max-width: 400px) {
		.dashed h2 {
			flex-flow: row wrap;
			row-gap: 0.65em;
		}
		:global(.title-action-btn) {
			margin-left: 0;
		}
	}
</style>
