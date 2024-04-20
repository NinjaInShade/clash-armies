<script lang="ts">
	import { onMount, getContext } from 'svelte';
	import type { AppState, Army, Unit, Banner } from '~/lib/types';
	import { formatTime, getEntries } from '~/lib/utils';
	import { getTotals, getLevel } from '~/lib/army';
	import { ARMY_EDIT_FILLER, HOLD_ADD_SPEED, HOLD_REMOVE_SPEED } from '~/lib/constants';
	import { getCopyBtnTitle, getOpenBtnTitle, copyLink, openInGame } from '~/components/ViewArmy.svelte';
	import { deserialize, applyAction } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import C from '~/components';

	type TitleOptions = {
		level: number;
		type: Unit['type'];
		reachedMaxAmount: boolean;
		reachedSuperLimit?: boolean;
	};
	type UnitWithoutAmount = Omit<Unit, 'amount'>;
	type Props = { army?: Army & { armyCapacity: { troop: number; spell: number; siege: number } } };

	const { army } = $props<Props>();
	const app = getContext<AppState>('app');

	let errors = $state<Record<string, string[]>>({});

	let createdBy = $state<number>(1);
	let username = $state<string>('NinjaInShade');
	let banner = $state<Banner>('dark-ages');
	let name = $state<string | null>(null);
	let units = $state<Unit[]>([]);

	let saveDisabled = $derived(!name || name.length < 5 || name.length > 25 || !units.length);

	let troopUnits = $derived(units.filter((item) => item.type === 'Troop'));
	let siegeUnits = $derived(units.filter((item) => item.type === 'Siege'));
	let spellUnits = $derived(units.filter((item) => item.type === 'Spell'));
	let reachedSuperLimit = $derived(troopUnits.filter((t) => t.data[1].isSuper).length === 2);

	let holdInterval: ReturnType<typeof setInterval> | null = null;

	onMount(() => {
		if (!army) return;
		createdBy = army.createdBy;
		username = army.username;
		banner = army.banner;
		name = army.name;
		units = army.units;
		app.townHall = army.townHall;
	});

	const capacity = $derived.call(() => {
		return {
			troop: army?.armyCapacity.troop ?? app.armyCapacity.troop,
			spell: army?.armyCapacity.spell ?? app.armyCapacity.spell,
			siege: army?.armyCapacity.siege ?? app.armyCapacity.siege
		};
	});
	const housingSpaceUsed = $derived.call(() => getTotals(units));

	function add(unit: UnitWithoutAmount, arr = units) {
		const existing = arr.find((item) => item.name === unit.name);
		if (existing) {
			existing.amount += 1;
		} else {
			arr.push({ ...unit, amount: 1 });
		}
		return arr;
	}

	function remove(name: Unit['name']) {
		const existingIndex = units.findIndex((item) => item.name === name);
		if (units[existingIndex].amount === 1) {
			units.splice(existingIndex, 1);
		} else {
			units[existingIndex].amount -= 1;
		}
	}

	function initHoldAdd(unit: UnitWithoutAmount) {
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

	function initHoldRemove(name: Unit['name']) {
		// remove straight away in case user clicked
		remove(name);
		// if we removed the last troop/spell stop removing
		const exists = units.find((item) => item.name === name);
		if (!exists) {
			stopHold();
			return;
		}
		holdInterval = setInterval(() => {
			remove(name);
			// if we removed the last troop/spell stop removing
			const exists = units.find((item) => item.name === name);
			if (!exists) {
				stopHold();
			}
		}, HOLD_REMOVE_SPEED);
	}

	function stopHold() {
		clearInterval(holdInterval ?? undefined);
		holdInterval = null;
	}

	function willOverflowHousingSpace(unit: UnitWithoutAmount) {
		const selectedCopy: Unit[] = JSON.parse(JSON.stringify(units));
		const selectedPreview = add(unit, selectedCopy);
		const { troops, sieges, spells } = getTotals(selectedPreview);
		return troops > capacity.troop || sieges > capacity.siege || spells > capacity.spell;
	}

	function getCardTitle(opts: TitleOptions) {
		const { level, type, reachedMaxAmount, reachedSuperLimit } = opts;
		if (level === -1) {
			return `You do not have this ${type.toLowerCase()} unlocked warrior!`;
		}
		if (reachedMaxAmount) {
			return `There is no space left to house this ${type.toLowerCase()} warrior!`;
		}
		if (reachedSuperLimit) {
			return 'You have reached the max two super troops per army limit warrior!';
		}
		return undefined;
	}

	function editBanner() {
		const onSave = (newBanner: Banner) => {
			banner = newBanner;
		};
		app.openModal(C.EditBanner, { banner, onSave });
	}

	async function handleSubmit(ev: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }) {
		ev.preventDefault();

		if (!ev.submitter) {
			return;
		}

		const deletingArmy = ev.submitter.id === 'delete-army';
		const action = deletingArmy ? ev.submitter.getAttribute('formaction') : ev.currentTarget.action;
		if (!action) {
			return;
		}
		if (deletingArmy) {
			const confirmed = window.confirm('Are you sure you want to delete this army warrior? This cannot be undone!');
			if (!confirmed) {
				return;
			}
		}

		// Create request body data
		const body = new FormData();
		if (deletingArmy) {
			body.append('id', JSON.stringify(army?.id));
		} else {
			const updatedArmy = { id: army?.id, name, units, banner, townHall: app.townHall };
			body.append('army', JSON.stringify(updatedArmy));
		}

		// Fetch and deserialize response
		const response = await fetch(action, { method: 'POST', body });
		const result = deserialize(await response.text());

		if (result.type === 'failure' && result.data?.fieldErrors) {
			errors = result.data.fieldErrors as Record<string, string[]>;
			return;
		}
		if (army) {
			// TODO: display toast "Army successfully saved"
		}
		await invalidateAll();
		return applyAction(result);
	}
</script>

<svelte:head>
	<title>ClashArmies • {army ? 'Edit' : 'Create'} Army</title>
</svelte:head>

<svelte:window
	onmouseup={() => {
		// handle this on window in case user mouses cursor from the card then does mouseup
		stopHold();
	}}
/>

<form method="POST" action="/create?/saveArmy" onsubmit={handleSubmit}>
	{#if Object.keys(errors).length}
		<section class="errors" class:creating={!army}>
			<div class="container">
				<b>Sorry warrior, the army could not be {army ? 'saved' : 'created'}:</b>
				<ul>
					{#each Object.entries(errors) as [field, messages]}
						{#each messages as error}
							<li>{`${field[0].toUpperCase()}${field.slice(1)}`}: <span>{error}</span></li>
						{/each}
					{/each}
				</ul>
			</div>
		</section>
	{/if}

	<section class="banner" class:creating={!army}>
		<div class="container">
			<img src="/clash/banners/{banner}.png" alt="Clash of clans banner artwork" class="banner-img" />
			<div class="banner-overlay">
				<div>
					<C.Fieldset label="Army name:" htmlName="name">
						<C.Input bind:value={name} maxlength={25} --input-width="250px" />
					</C.Fieldset>
					<b>Assembled by <a href="/user/{createdBy}">@{username}</a></b>
				</div>
				<div>
					<small class="total">
						<img src="/clash/ui/clock.png" alt="Clash of clans clock (time to train army)" />
						{formatTime(housingSpaceUsed.time * 1000)}
					</small>
					<div class="totals">
						<small class="total">
							<img src="/clash/ui/troops.png" alt="Clash of clans troop capacity" />
							{housingSpaceUsed.troops}/{capacity.troop}
						</small>
						{#if capacity.spell > 0}
							<small class="total">
								<img src="/clash/ui/spells.png" alt="Clash of clans spell capacity" />
								{housingSpaceUsed.spells}/{capacity.spell}
							</small>
						{/if}
						{#if capacity.siege > 0}
							<small class="total">
								<img src="/clash/ui/sieges.png" alt="Clash of clans siege machine capacity" />
								{housingSpaceUsed.sieges}/{capacity.siege}
							</small>
						{/if}
					</div>
				</div>
			</div>
			<button class="select-banner-btn" type="button" onclick={editBanner}>
				<svg width="27" height="27" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M3 27C2.175 27 1.469 26.7065 0.882 26.1195C0.295 25.5325 0.001 24.826 0 24V3C0 2.175 0.294 1.469 0.882 0.882C1.47 0.295 2.176 0.001 3 0H24C24.825 0 25.5315 0.294 26.1195 0.882C26.7075 1.47 27.001 2.176 27 3V24C27 24.825 26.7065 25.5315 26.1195 26.1195C25.5325 26.7075 24.826 27.001 24 27H3ZM4.5 21H22.5L16.875 13.5L12.375 19.5L9 15L4.5 21Z"
						fill="white"
					/>
				</svg>
			</button>
		</div>
	</section>

	<section class="units">
		<div class="container">
			<h2>Units</h2>
			{@render unitsSelected()}
			{@render unitsPicker('Troop')}
			{#if app.armyCapacity.spell > 0}
				{@render unitsPicker('Spell')}
			{/if}
			{#if app.armyCapacity.siege > 0}
				{@render unitsPicker('Siege')}
			{/if}
		</div>
	</section>

	<section class="actions">
		<div class="container">
			<div class="left">
				<C.Button onclick={async () => copyLink(units)} disabled={!units.length} title={getCopyBtnTitle(units)}>Copy link</C.Button>
				<C.Button onclick={() => openInGame(units)} disabled={!units.length} title={getOpenBtnTitle(units)}>Open in-game</C.Button>
			</div>
			<div class="right">
				{#if army}
					<C.Button type="submit" formaction="/create?/deleteArmy" theme="danger" id="delete-army">Delete</C.Button>
				{/if}
				<C.Button type="submit" disabled={saveDisabled}>{army ? 'Save' : 'Create'}</C.Button>
			</div>
		</div>
	</section>
</form>

{#snippet unitsSelected()}
	<ul class="selected-grid">
		{#each [...troopUnits, ...spellUnits, ...siegeUnits] as unit}
			<li>
				<button
					class="selected-card"
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
					<C.UnitDisplay {...unit} />
				</button>
			</li>
		{/each}
		{@render filler()}
	</ul>
{/snippet}

{#snippet unitsPicker(type: 'Troop' | 'Siege' | 'Spell')}
	<!-- I have to admit, messing around with the type param like this isn't the prettiest thing, but I'm more comfortable with the logic being defined in one place :^ -->
	{@const entries = type === 'Troop' ? getEntries(app.troops) : type === 'Siege' ? getEntries(app.sieges) : getEntries(app.spells)}
	{@const heading = `Select ${type === 'Troop' ? 'troops' : type === 'Siege' ? 'siege machine' : 'spells'}`}
	<h3>{heading}</h3>
	<ul class="picker-grid">
		{#each entries as [name, data]}
			{@const unit = { type, name, data }}
			{@const level = getLevel(unit, app)}
			{@const reachedMaxAmount = willOverflowHousingSpace(unit)}
			<!-- Disable if reached max unique super limit of 2 and this troop isn't one already selected -->
			<!-- TOOD: fix data[1].isSuper, properties like isSuper that apply to all levels should not live in level data -->
			{@const disableSuper = type === 'Troop' && data[1].isSuper && !units.find((item) => item.name === unit.name) && reachedSuperLimit}
			{@const title = getCardTitle({ level, type, reachedMaxAmount, reachedSuperLimit: disableSuper })}
			<li>
				<button
					class="picker-card"
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
{/snippet}

{#snippet filler()}
	{@const amount = ARMY_EDIT_FILLER}
	{@const length = amount - units.length > 0 ? amount - units.length : 0}
	{#each Array.from({ length }) as _}
		<li class="selected-card filler" />
	{/each}
{/snippet}

<style>
	.errors {
		padding: 0 var(--side-padding);
	}
	.errors.creating {
		padding-top: 50px;
	}
	.errors .container {
		border-radius: 4px;
		padding: 12px 16px;
		background-color: #3f2727;
		border: 1px solid var(--error-500);
		color: var(--grey-100);
	}
	.errors ul {
		margin-top: 4px;
	}
	.errors li {
		list-style: square;
		list-style-position: inside;
	}

	.banner {
		padding: 0 var(--side-padding);
	}
	.banner.creating {
		padding-top: 50px;
	}
	.errors + .banner {
		padding-top: 24px;
	}

	.units {
		padding: 64px var(--side-padding) 50px var(--side-padding);
	}

	.banner .container {
		border-radius: 0.5em;
		overflow: hidden;
		position: relative;
		width: 100%;
	}

	.banner-img {
		display: block;
		object-fit: cover;
		aspect-ratio: 1920 / 800;
		max-height: 400px;
		height: 100%;
		width: 100%;
	}

	.banner-overlay {
		display: flex;
		flex-flow: column nowrap;
		justify-content: space-between;
		position: absolute;
		background-color: hsla(0, 0%, 0%, 0.6);
		padding: 40px 40px 32px 40px;
		max-width: 400px;
		height: 100%;
		left: 0;
		top: 0;
	}

	.banner-overlay h1 {
		color: var(--primary-400);
	}

	.banner-overlay b,
	.banner-overlay b a {
		font-size: var(--fs);
		line-height: var(--fs-lh);
		color: var(--grey-100);
		font-weight: 500;
	}

	.banner-overlay b {
		display: block;
		margin-top: 8px;
	}

	.select-banner-btn {
		border: 1px dotted var(--grey-100);
		background-color: var(--grey-600);
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

	.select-banner-btn:hover {
		background-color: var(--grey-500);
	}

	.totals {
		display: flex;
		align-items: center;
		margin-top: 12px;
		gap: 12px;
	}

	.total {
		display: flex;
		align-items: center;
		font-family: 'Clash', sans-serif;
		color: var(--grey-100);
		font-size: 1em;
	}

	.total img {
		display: block;
		max-height: 24px;
		margin-right: 8px;
		height: 100%;
		width: auto;
	}

	.tags {
		display: flex;
		align-items: flex-start;
		margin-top: 16px;
		gap: 6px;
	}

	.tags p {
		display: flex;
		align-items: center;
		background-color: var(--grey-500);
		color: var(--grey-100);
		font-size: var(--fs);
		font-weight: 700;
		padding: 8px 12px;
		border-radius: 50px;
		height: 32px;
		gap: 4px;
	}

	.actions {
		position: fixed;
		box-shadow: hsla(0, 0%, 30%, 0.4) 0px -20px 30px -10px;
		background-color: var(--grey-800);
		padding: 16px var(--side-padding);
		width: 100%;
		bottom: 0;
		left: 0;
	}

	.actions .container,
	.actions .left,
	.actions .right {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.actions .container {
		justify-content: space-between;
	}

	.selected-grid {
		display: grid;
		grid-template-rows: auto;
		grid-template-columns: repeat(14, 1fr);
		margin-top: 8px;
		gap: 6px;
	}

	.picker-grid {
		display: grid;
		grid-template-rows: auto;
		grid-template-columns: repeat(18, 1fr);
		gap: 6px;
	}

	.selected-card {
		display: flex;
		justify-content: center;
		align-items: center;
		overflow: hidden;
		border-radius: 10px;
		font-size: 0.6em;
		height: 80px;
		width: 100%;
	}

	.selected-card.filler {
		border: 1px dashed var(--grey-500);
	}

	.picker-card {
		display: flex;
		justify-content: center;
		align-items: center;
		overflow: hidden;
		border-radius: 10px;
		transition: none;
		max-height: 60px;
		height: 100%;
		width: 100%;
	}

	.picker-card:disabled {
		cursor: not-allowed;
		filter: grayscale(1);
		opacity: 0.5;
	}

	h3 {
		margin: 1em 0 0.5em 0;
		font-weight: 400;
	}

	:global(body) {
		/* Must match .actions height */
		margin-bottom: 76px;
	}
</style>
