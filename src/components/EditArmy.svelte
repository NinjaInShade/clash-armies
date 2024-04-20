<script lang="ts">
	import { getContext } from 'svelte';
	import type { AppState, TroopName, TroopData, SpellName, SpellData, SiegeName, SiegeData, Unit, Units, HousingSpace } from '~/lib/types';
	import { ARMY_CREATE_TROOP_FILLER, ARMY_CREATE_SPELL_FILLER, HOLD_ADD_SPEED, HOLD_REMOVE_SPEED, SECOND, MINUTE, HOUR } from '~/lib/constants';
	import { getTroopLevel, getSiegeLevel, getSpellLevel, generateLink, openLink } from '~/lib/army';
	import Alert from './Alert.svelte';
	import AssetDisplay from './AssetDisplay.svelte';
	import Button from './Button.svelte';

	type TitleOptions = {
		level: number;
		type: Unit['type'];
		reachedMaxAmount: boolean;
		reachedSuperLimit?: boolean;
	};
	type UnitWithoutAmount = Omit<Unit, 'amount'>;
	type Totals = HousingSpace & { time: number };

	const app = getContext<AppState>('app');

	let units = $state<Units>([]);
	let troopUnits = $derived(units.filter((item) => item.type === 'Troop' || item.type === 'Siege'));
	let spellUnits = $derived(units.filter((item) => item.type === 'Spell'));

	let reachedSuperLimit = $derived(troopUnits.filter((t) => t.type === 'Troop' && t.data[1].isSuper).length === 2);

	let maxHousingSpace: HousingSpace = { troops: 320, spells: 11, sieges: 1 }; // TODO: calculate dynamically
	let housingSpaceUsed = $derived.call(getSelectedTotals);

	let holdAddInterval: ReturnType<typeof setInterval> | null = null;
	let holdRemoveInterval: ReturnType<typeof setInterval> | null = null;

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
		holdAddInterval = setInterval(() => {
			// if no more housing space  don't try adding & stop
			if (willOverflowHousingSpace(unit)) {
				stopHoldAdd();
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
			stopHoldRemove();
			return;
		}
		holdRemoveInterval = setInterval(() => {
			remove(name);
			// if we removed the last troop/spell stop removing
			const exists = units.find((item) => item.name === name);
			if (!exists) {
				stopHoldRemove();
			}
		}, HOLD_REMOVE_SPEED);
	}

	function stopHoldAdd() {
		if (!holdAddInterval) return;
		clearInterval(holdAddInterval);
		holdAddInterval = null;
	}

	function stopHoldRemove() {
		if (!holdRemoveInterval) return;
		clearInterval(holdRemoveInterval);
		holdRemoveInterval = null;
	}

	async function copyLink() {
		const link = generateLink(units);
		await navigator.clipboard.writeText(link);
		alert(`Successfully copied "${link}" to clipboard!`);
		// TODO: change to a toast notification
	}

	function openInGame() {
		const link = generateLink(units);
		openLink(link);
	}

	/**
	 * @param time: the time to format in miliseconds
	 * @returns formatted time string e.g. '1m 20s'
	 */
	function formatTime(time: number) {
		let parts: string[] = [];

		if (time >= HOUR) {
			const hours = Math.floor(time / HOUR);
			parts.push(`${hours}h`);
			time -= hours * HOUR;
		}
		if (time >= MINUTE) {
			const mins = Math.floor(time / MINUTE);
			parts.push(`${mins}m`);
			time -= mins * MINUTE;
		}
		if (time >= SECOND) {
			const secs = Math.floor(time / SECOND);
			parts.push(`${secs}s`);
			time -= secs * SECOND;
		}
		if (time > 0) {
			throw new Error(`Unexpected time left over after formatting: "${time}"`);
		}

		return parts.length ? parts.join(' ') : '0s';
	}

	function getSelectedTotals(arr = units) {
		if (!arr.length) {
			return { troops: 0, sieges: 0, spells: 0, time: 0 };
		}
		// These types can train at the same time.
		// The total time to train then is the max out of them all.
		const ParallelTimeCount = {
			troops: 0,
			spells: 0,
			sieges: 0
		};
		return arr.reduce<Totals>(
			(prev, curr) => {
				const data = Object.values<Unit['data'][number]>(curr.data);
				const housingSpace = data[data.length - 1].housingSpace;
				const trainingTime = data[data.length - 1].trainingTime;
				const key = curr.type.toLowerCase() + 's';

				ParallelTimeCount[key] += trainingTime * curr.amount;
				prev[key] += housingSpace * curr.amount;
				prev.time = Math.max(...Object.values(ParallelTimeCount));

				return prev;
			},
			{ troops: 0, sieges: 0, spells: 0, time: 0 }
		);
	}

	function willOverflowHousingSpace(unit: UnitWithoutAmount) {
		const selectedCopy: Units = JSON.parse(JSON.stringify(units));
		const selectedPreview = add(unit, selectedCopy);
		const { troops, sieges, spells } = getSelectedTotals(selectedPreview);
		return troops > maxHousingSpace.troops || sieges > maxHousingSpace.sieges || spells > maxHousingSpace.spells;
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
</script>

<svelte:head>
	<title>ClashArmies • Create Army</title>
</svelte:head>

<svelte:window
	onmouseup={() => {
		// handle this on window in case user mouses cursor from the
		// card (maybe we should stop adding/removing if mouse leaves card?)
		stopHoldAdd();
		stopHoldRemove();
	}}
/>

<!-- <div class="alert">
	<div class="container">
		<Alert>
			Clan castle troops/spells, pets, heroes and hero equipment must be manually edited in game after opening the army via the generated link. Hopefully one
			day Supercell allows this!
		</Alert>
	</div>
</div> -->

<section class="troops">
	<div class="container">
		<h2 class="heading"><span>1</span> Troops</h2>
		<ul class="grid">
			{#each troopUnits as troop}
				<li>
					<button
						class="object-card"
						onmousedown={() => initHoldRemove(troop.name)}
						onkeypress={(ev) => {
							if (ev.key !== 'Enter') {
								return;
							}
							remove(troop.name);
						}}
					>
						<AssetDisplay {...troop} />
					</button>
				</li>
			{/each}
			{#each Array.from({ length: ARMY_CREATE_TROOP_FILLER - troopUnits.length > 0 ? ARMY_CREATE_TROOP_FILLER - troopUnits.length : 0 }) as filler}
				<button class="object-card">
					<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" class="add-icon">
						<path
							d="M15 0C11.0367 0.0480892 7.24926 1.64388 4.44657 4.44657C1.64388 7.24926 0.0480892 11.0367 0 15C0.0480892 18.9633 1.64388 22.7507 4.44657 25.5534C7.24926 28.3561 11.0367 29.9519 15 30C18.9633 29.9519 22.7507 28.3561 25.5534 25.5534C28.3561 22.7507 29.9519 18.9633 30 15C29.9519 11.0367 28.3561 7.24926 25.5534 4.44657C22.7507 1.64388 18.9633 0.0480892 15 0ZM23.5714 16.0714H16.0714V23.5714H13.9286V16.0714H6.42857V13.9286H13.9286V6.42857H16.0714V13.9286H23.5714V16.0714Z"
							fill="#5C5C5C"
						/>
					</svg>
				</button>
			{/each}
		</ul>
		<h3>Select troops</h3>
		<ul class="picker-grid">
			<!-- prettier-ignore -->
			{#each (Object.entries(app.troops) as [TroopName, TroopData][]) as [name, data]}
				{@const type = 'Troop'}
				{@const troop = { type, name, data } as const}
				{@const level = getTroopLevel(name, app)}
				{@const reachedMaxAmount = willOverflowHousingSpace(troop)}
				<!-- Disable if reached max unique super limit of 2 and this troop isn't one of those -->
				<!-- TOOD: fix data[1].isSuper, properties like isSuper that apply to all levels should not live in level data -->
				{@const disableSuper = data[1].isSuper && !units.find(sel => sel.name === troop.name) && reachedSuperLimit}
				{@const title = getCardTitle({ level, type, reachedMaxAmount, reachedSuperLimit: disableSuper })}
				<li>
					<button
						class="picker-card"
						disabled={reachedMaxAmount || disableSuper || level === -1}
						onmousedown={() => initHoldAdd(troop)}
						onkeypress={(ev) => {
							if (ev.key !== 'Enter') {
								return;
							}
							add(troop);
						}}
					>
						<AssetDisplay {type} {name} {data} {level} {title} />
					</button>
				</li>
			{/each}
		</ul>
		<h3>Select siege machine</h3>
		<ul class="picker-grid">
			<!-- prettier-ignore -->
			{#each (Object.entries(app.sieges) as [SiegeName, SiegeData][]) as [name, data]}
				{@const type = 'Siege'}
				{@const siege = { type, name, data } as const}
				{@const level = getSiegeLevel(name, app)}
				{@const reachedMaxAmount = willOverflowHousingSpace(siege)}
				{@const title = getCardTitle({ level, type, reachedMaxAmount })}
				<li>
					<button
						class="picker-card"
						disabled={reachedMaxAmount || level === -1}
						onmousedown={() => initHoldAdd(siege)}
						onkeypress={(ev) => {
							if (ev.key !== 'Enter') {
								return;
							}
							add(siege);
						}}
					>
						<AssetDisplay {type} {name} {data} {level} {title} />
					</button>
				</li>
			{/each}
		</ul>
	</div>
</section>

<section class="spells">
	<div class="container">
		<h2 class="heading"><span>2</span> Spells</h2>
		<ul class="grid">
			{#each spellUnits as spell}
				<li>
					<button
						class="object-card"
						onmousedown={() => initHoldRemove(spell.name)}
						onkeypress={(ev) => {
							if (ev.key !== 'Enter') {
								return;
							}
							remove(spell.name);
						}}
					>
						<AssetDisplay {...spell} />
					</button>
				</li>
			{/each}
			{#each Array.from({ length: ARMY_CREATE_SPELL_FILLER - spellUnits.length > 0 ? ARMY_CREATE_SPELL_FILLER - spellUnits.length : 0 }) as filler}
				<button class="object-card">
					<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" class="add-icon">
						<path
							d="M15 0C11.0367 0.0480892 7.24926 1.64388 4.44657 4.44657C1.64388 7.24926 0.0480892 11.0367 0 15C0.0480892 18.9633 1.64388 22.7507 4.44657 25.5534C7.24926 28.3561 11.0367 29.9519 15 30C18.9633 29.9519 22.7507 28.3561 25.5534 25.5534C28.3561 22.7507 29.9519 18.9633 30 15C29.9519 11.0367 28.3561 7.24926 25.5534 4.44657C22.7507 1.64388 18.9633 0.0480892 15 0ZM23.5714 16.0714H16.0714V23.5714H13.9286V16.0714H6.42857V13.9286H13.9286V6.42857H16.0714V13.9286H23.5714V16.0714Z"
							fill="#5C5C5C"
						/>
					</svg>
				</button>
			{/each}
		</ul>
		<h3>Select Spells</h3>
		<ul class="picker-grid">
			<!-- prettier-ignore -->
			{#each (Object.entries(app.spells) as [SpellName, SpellData][]) as [name, data]}
				{@const type = 'Spell'}
				{@const spell = { type, name, data } as const}
				{@const level = getSpellLevel(name, app)}
				{@const reachedMaxAmount = willOverflowHousingSpace(spell)}
				{@const title = getCardTitle({ level, type, reachedMaxAmount })}
				<li>
					<button
						class="picker-card"
						disabled={reachedMaxAmount || level === -1}
						onmousedown={() => initHoldAdd(spell)}
						onkeypress={(ev) => {
							if (ev.key !== 'Enter') {
								return;
							}
							add(spell);
						}}
					>
						<AssetDisplay {type} {name} {data} {level} {title} />
					</button>
				</li>
			{/each}
		</ul>
	</div>
</section>

<section class="actions">
	<div class="container">
		<div class="left">
			<!-- TOOO: make totals components -->
			<small class="capacity">
				<img src="/clash/ui/troops.png" alt="Clash of clans troop capacity image" />
				{housingSpaceUsed.troops} / {maxHousingSpace.troops}
			</small>
			<small class="capacity">
				<img src="/clash/ui/spells.png" alt="Clash of clans spell capacity image" />
				{housingSpaceUsed.spells} / {maxHousingSpace.spells}
			</small>
			<small class="capacity">
				<img src="/clash/ui/sieges.png" alt="Clash of clans siege machine capacity image" />
				{housingSpaceUsed.sieges} / {maxHousingSpace.sieges}
			</small>
			<small class="capacity">
				<img src="/clash/ui/clock.png" alt="Clash of clans clock (time to train army) image" />
				{formatTime(housingSpaceUsed.time * 1000)}
			</small>
		</div>
		<div class="right">
			<Button
				onclick={copyLink}
				disabled={!units.length}
				title={!units.length
					? 'Army cannot be shared when empty'
					: "Copies an army link to your clipboard for sharing.\nNote: may not work if the army isn't at full capacity"}
			>
				Share
			</Button>
			<Button
				onclick={openInGame}
				disabled={!units.length}
				title={!units.length
					? 'Army cannot be opened in-game when empty'
					: "Opens clash of clans and allows you to paste your army in one of your slots.\nNote: may not work if the army isn't at full capacity"}
			>
				Open in-game
			</Button>
			<Button>Save</Button>
		</div>
	</div>
</section>

<style>
	/* TODO: move capacity styles to component */
	.capacity {
		display: flex;
		align-items: center;
		background-color: var(--grey-900);
		font-family: 'Clash', sans-serif;
		color: var(--grey-100);
		border-radius: 6px;
		padding-right: 8px;
		font-size: 0.85em;
		height: 26px;
	}
	.capacity img {
		max-height: 32px;
		margin-left: -12px;
		margin-right: 16px;
		height: 100%;
		width: auto;
	}
	/* TODO: move capacity styles to component */

	.alert {
		padding: 50px var(--side-padding) 0 var(--side-padding);
	}

	.troops {
		padding: 50px var(--side-padding);
	}

	.spells {
		padding: 0 var(--side-padding) 50px var(--side-padding);
	}

	.extras .container {
		border: 1px dashed var(--grey-500);
		padding: 32px;
	}

	:global(body) {
		/* Must match .actions height */
		margin-bottom: 76px;
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
		gap: 1em;
	}

	.actions .left {
		padding-left: 12px;
		gap: 1.5em;
	}

	.actions .container {
		justify-content: space-between;
	}

	.heading,
	.heading span {
		font-size: var(--heading);
		line-height: var(--heading-lh);
	}

	.heading {
		display: flex;
		align-items: center;
		margin-bottom: 24px;
		gap: 16px;
	}

	.heading span {
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--primary-400);
		color: var(--grey-100);
		border-radius: 50%;
		height: 40px;
		width: 40px;
	}

	.grid,
	.picker-grid {
		display: grid;
		grid-template-columns: repeat(10, 1fr);
		grid-template-rows: auto;
		gap: 8px;
	}

	.picker-grid {
		grid-template-columns: repeat(18, 1fr);
	}

	.picker-grid li {
		width: 100%;
	}

	.object-card,
	.picker-card {
		display: flex;
		justify-content: center;
		align-items: center;
		overflow: hidden;
		border-radius: 6px;
		width: 100%;
	}

	.object-card {
		border: 1px dashed var(--grey-500);
		height: 125px;
	}

	.picker-card {
		transition: none;
		max-height: 60px;
		height: 100%;
	}

	.picker-card:disabled {
		cursor: not-allowed;
		filter: grayscale(1);
		opacity: 0.5;
	}

	.object-card .add-icon {
		transition: opacity 0.15s ease-in-out;
		opacity: 0;
	}

	.object-card:hover .add-icon,
	.object-card:focus .add-icon {
		opacity: 1;
	}

	h3 {
		margin: 24px 0 16px 0;
		font-weight: 400;
	}
</style>
