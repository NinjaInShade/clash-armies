<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import { invalidateAll, goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { formatTime } from '~/lib/client/army';
	import { HOLD_ADD_SPEED, HOLD_REMOVE_SPEED, getTotals, getUnitLevel, BANNERS } from '~/lib/shared/utils';
	import type { AppState, Army, Unit, ArmyUnit, Banner, UnitType, FetchErrors } from '~/lib/shared/types';
	import C from '~/components';

	type TitleOptions = {
		level: number;
		type: Unit['type'];
		reachedMaxAmount: boolean;
		reachedSuperLimit?: boolean;
	};
	type Props = { army?: Army };

	const { army }: Props = $props();
	const app = getContext<AppState>('app');

	let errors = $state<FetchErrors | null>(null);

	let createdBy = $state<number | null>(app.user?.id ?? null);
	let username = $state<string | null>(app.user?.username ?? null);
	let townHall = $state<number>(16);
	let banner = $state<Banner>(BANNERS[Math.floor(Math.random() * BANNERS.length)]);
	let name = $state<string | null>(null);
	let units = $state<ArmyUnit[]>([]);

	let saveDisabled = $derived(!name || name.length < 2 || name.length > 25 || !units.length);

	let _troopUnits = $derived(units.filter((item) => item.type === 'Troop'));
	let troopUnits = $derived([..._troopUnits.filter(x => !x.isSuper), ..._troopUnits.filter(x => x.isSuper)]);
	let siegeUnits = $derived(units.filter((item) => item.type === 'Siege'));
	let spellUnits = $derived(units.filter((item) => item.type === 'Spell'));
	let reachedSuperLimit = $derived(troopUnits.filter((t) => Boolean(app.units.find((x) => x.type === t.type && x.name === t.name)?.isSuper)).length === 2);

	let holdInterval: ReturnType<typeof setInterval> | null = null;

	onMount(() => {
		if (!army) return;
		createdBy = army.createdBy;
		username = army.username;
		townHall = army.townHall;
		banner = army.banner;
		name = army.name;
		units = army.units;
	});

	const capacity = $derived.by(() => {
		const thData = app.townHalls.find((th) => th.level === townHall);
		// Should never happen...
		if (!thData) return { troop: 0, spell: 0, siege: 0 };
		return { troop: thData.troopCapacity, spell: thData.spellCapacity, siege: thData.siegeCapacity };
	});
	const housingSpaceUsed = $derived.by(() => getTotals(units));

	function add(unit: ArmyUnit, arr = units) {
		const existing = arr.find((item) => item.name === unit.name);
		if (existing) {
			existing.amount += 1;
		} else {
			const _unit = app.units.find((x) => x.type === unit.type && x.name === unit.name);
			if (!_unit) {
				throw new Error(`Unknown unit: "${unit.name}"`);
			}
			arr.push({ ...unit, unitId: _unit.id, amount: 1 });
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

	function initHoldAdd(unit: ArmyUnit) {
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

	function willOverflowHousingSpace(unit: ArmyUnit) {
		const selectedCopy: ArmyUnit[] = JSON.parse(JSON.stringify(units));
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

	function setTownHall(value: number) {
		if (typeof value !== 'number' || value < 1 || value > app.townHalls.length) {
			throw new Error(`Town hall ${value} doesn't exist`);
		}
		if (value < townHall && units.length) {
			const confirmed = confirm('You are selecting a lower town hall, units will be cleared. Select anyway?');
			if (confirmed) {
				units = [];
			} else {
				return;
			}
		}
		townHall = value;
	}

	async function saveArmy() {
		const data = { id: army?.id, name, units, banner, townHall };
		const response = await fetch('/armies', {
			method: 'POST',
			body: JSON.stringify(data),
			headers: { 'Content-Type': 'application/json' }
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

<!-- Handle mouseup on window in case user mouses cursor from the card then does mouseup -->
<svelte:window onmouseup={stopHold} />

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
		<C.Fieldset label="Army name:" htmlName="name" style="padding: 0 8px" --input-width="250px">
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
			<h2>Unit selector</h2>
			<div class="dashed totals">
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
				<small class="total">
					<img src="/clash/ui/clock.png" alt="Clash of clans clock (time to train army)" />
					{formatTime(housingSpaceUsed.time * 1000)}
				</small>
			</div>
		</div>
		<ul class="units-list">
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
						<C.UnitDisplay {...unit} />
					</button>
				</li>
			{/each}
		</ul>
		<div class="picker-container">
			{@render unitsPicker('Troop')}
        </div>
		{#if capacity.spell > 0}
			<div class="picker-container">
				{@render unitsPicker('Spell')}
            </div>
		{/if}
		{#if capacity.siege > 0}
            <div class="picker-container">
                {@render unitsPicker('Siege')}
			</div>
		{/if}
    </div>
</section>

{#snippet unitsPicker(type: UnitType)}
	{@const _appUnits = app.units.filter((x) => x.type === type)}
	{@const appUnits = [..._appUnits.filter(x => !x.isSuper), ..._appUnits.filter(x => x.isSuper)]}
	{@const heading = `Select ${type === 'Troop' ? 'troops' : type === 'Siege' ? 'siege machine' : 'spells'}`}
	<h3>{heading}</h3>
	<ul class="picker-list">
		{#each appUnits as unit}
			<!-- Disable if reached max unique super limit of 2 and this troop isn't one already selected -->
			{@const disableSuper = unit.isSuper && !units.find((item) => item.name === unit.name) && reachedSuperLimit}
			{@const thData = app.townHalls.find((t) => t.level === townHall)}
			{@const level = thData ? getUnitLevel(unit, { th: thData, units: app.units }) : -1}
			{@const reachedMaxAmount = willOverflowHousingSpace(unit)}
			{@const title = getCardTitle({ level, type, reachedMaxAmount, reachedSuperLimit: disableSuper })}
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
{/snippet}

{#if errors}
	<div class="errors">
		<C.Errors {errors} />
	</div>
{/if}

<div class="army-controls">
	<C.Button asLink href='{army ? `/armies/${army.id}` : '/armies'}'>Cancel</C.Button>
	<C.Button onclick={saveArmy} disabled={saveDisabled}>{army ? 'Save' : 'Create'}</C.Button>
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
	.dashed,
	.dashed h2 {
		background-color: var(--grey-800);
		border: 1px dashed var(--grey-500);
		border-radius: 8px;
	}
	.dashed > div {
		margin-top: -12px;
	}
	.dashed h2 {
		font-family: 'Poppins', sans-serif;
		font-size: var(--fs);
		line-height: var(--fs-lh);
		color: var(--grey-100);
		font-weight: bold;
		letter-spacing: 2px;
		text-transform: uppercase;
	}
	.dashed h2,
	.units .totals {
		display: inline-block;
		border-radius: 4px;
		margin-bottom: 16px;
		padding: 6px 8px;
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
		margin-top: 32px;
	}
	.units .title {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 24px;
	}
	.units-list {
		--bottom-padding: 16px;
		border-bottom: 1px dashed var(--grey-500);
		margin-bottom: 24px;
		padding: 0 32px var(--bottom-padding) 32px;
		/* Prevent page shift when adding first unit */ 
		min-height: calc(var(--unit-size) + var(--bottom-padding) + 1px);
	}
	.units-list, .picker-list {
		--gap: 6px;
		display: flex;
		flex-flow: row wrap;
		gap: var(--gap);
	}
	.units-list li,
	.picker-list li {
		--unit-border-radius: 6px;
		--amount-size: 16px;
		--lvl-size: 13px;
		width: var(--unit-size);
		height: var(--unit-size);
	}
	.units-list li button,
	.picker-list li button {
		display: block;
		width: 100%;
		height: 100%;
	}
	.picker-container {
		padding: 0 32px;
	}
	.picker-container:not(:last-child) {
		padding-bottom: 16px;
	}
	.units > div {
		padding-bottom: 24px;
	}
	.picker-list {
		--max-rows: 3;
		padding-right: 12px;
		/** Show max 3 rows of units (meant more for mobile so you can still see the unit you've selected at all times) */
		max-height: calc((var(--unit-size) * var(--max-rows)) + (var(--gap) * (var(--max-rows) - 1)));
		overflow-y: auto;
	}
	.picker-list li button:disabled {
		filter: grayscale(1);
	}
	.units :global(h3) {
		font-size: var(--fs);
		line-height: var(--fs-lh);
		margin-bottom: 8px;
	}
	.units .totals {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.units .totals small {
		display: flex;
		align-items: center;
		font-family: 'Clash', sans-serif;
		color: var(--grey-100);
		font-size: 15px;
		min-width: 4ch;
		white-space: nowrap;
		gap: 4px;
	}
	.units .totals img {
		display: block;
		max-height: 22px;
		height: 100%;
		width: auto;
	}

	@media (max-width: 850px) {
		.details {
			margin-top: 36px;
		}
		.units {
			--unit-size: 60px;
		}
		.units-list li,
		.picker-list li {
			--amount-size: 14px;
			--lvl-size: 11px;
		}
		.errors {
			margin-top: 16px;
		}
		.army-controls {
			margin-top: 16px;
		}
	}

	@media (max-width: 600px) {
		.units .title {
			flex-flow: column nowrap;
			margin-bottom: 16px;
			gap: 0px;
		}
		.units .title > * {
			margin: 0;
			width: 100%;
		}
		.units h2 {
			border-bottom: none;
			padding-bottom: 0;
		}
		.units .totals {
			border-top: none;
		}
	}

	@media (max-width: 475px) {
		.units .totals {
			display: grid;
			grid-template-columns: repeat(2, min-content);
		}
		.details > div {
			padding: 0 16px 24px 16px;
		}
		.units .title {
			padding: 0 16px;
		}
		.picker-container {
			padding: 0 24px;
		}
		.units-list {
			padding: 0 24px var(--bottom-padding) 24px;
		}
	}

	@media (max-width: 400px) {
		.units-list li,
		.picker-list li {
			--amount-size: 12px;
			--lvl-size: 10px;
		}
	}
</style>
