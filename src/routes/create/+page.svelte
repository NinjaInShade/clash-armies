<script lang="ts">
	import { getContext } from 'svelte';
	import type { AppState, TroopName, TroopData, SpellName, SpellData, SiegeName, SiegeData, Selected, HousingSpace, SelectedTotals } from '~/lib/types';
	import { ARMY_CREATE_TROOP_FILLER, ARMY_CREATE_SPELL_FILLER } from '~/lib/constants';
	import { getTroopLevel, getSiegeLevel, getSpellLevel, generateLink, openLink } from '~/lib/army';
	import Alert from '~/components/Alert.svelte';
	import AssetDisplay from '~/components/AssetDisplay.svelte';
	import Button from '~/components/Button.svelte';

	const HOLD_ADD_SPEED = 200;
	const HOLD_REMOVE_SPEED = 200;

	const app = getContext<AppState>('app');

	let selected = $state<Selected[]>([]);
	let selectedTroops = $derived(selected.filter((item) => item.type === 'Troop' || item.type === 'Siege'));
	let selectedSpells = $derived(selected.filter((item) => item.type === 'Spell'));

	let reachedSuperLimit = $derived(selectedTroops.filter((t) => t.type === 'Troop' && t.data[1].isSuper).length === 2);

	let maxHousingSpace: HousingSpace = { troops: 320, spells: 11, sieges: 1 }; // TODO: calculate dynamically
	let housingSpaceUsed = $derived.call(getSelectedTotals);

	let holdAddInterval: ReturnType<typeof setInterval> | null = null;
	let holdRemoveInterval: ReturnType<typeof setInterval> | null = null;

	function add(item: Omit<Selected, 'amount'>, arr: Selected[] = selected) {
		const existing = arr.find((sel) => sel.name === item.name);
		if (existing) {
			existing.amount += 1;
		} else {
			arr.push({ ...item, amount: 1 });
		}
		return arr;
	}

	function remove(name: Selected['name']) {
		const existingIndex = selected.findIndex((sel) => sel.name === name);
		if (selected[existingIndex].amount === 1) {
			selected.splice(existingIndex, 1);
		} else {
			selected[existingIndex].amount -= 1;
		}
	}

	function initHoldAdd(item: Omit<Selected, 'amount'>) {
		if (willOverflowHousingSpace(item)) {
			return;
		}
		// add straight away in case user clicked
		add(item);
		holdAddInterval = setInterval(() => {
			// if no more housing space  don't try adding & stop
			if (willOverflowHousingSpace(item)) {
				stopHoldAdd();
				return;
			}
			add(item);
		}, HOLD_ADD_SPEED);
	}

	function initHoldRemove(name: Selected['name']) {
		// remove straight away in case user clicked
		remove(name);
		// if we removed the last troop/spell stop removing
		const exists = selected.find((item) => item.name === name);
		if (!exists) {
			stopHoldRemove();
			return;
		}
		holdRemoveInterval = setInterval(() => {
			remove(name);
			// if we removed the last troop/spell stop removing
			const exists = selected.find((item) => item.name === name);
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
		const link = generateLink(selected);
		await navigator.clipboard.writeText(link);
		alert(`Successfully copied "${link}" to clipboard!`);
		// TODO: change to a toast notification
	}

	function openInGame() {
		const link = generateLink(selected);
		openLink(link);
	}

	/**
	 * @param time: the time to format in miliseconds
	 * @returns formatted time string e.g. '1m 20s'
	 */
	function formatTime(time: number) {
		const SECOND = 1000;
		const MINUTE = SECOND * 60;
		const HOUR = MINUTE * 60;

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

	function getSelectedTotals(arr: Selected[] = selected) {
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
		return arr.reduce<SelectedTotals>(
			(prev, curr) => {
				const data = Object.values<Selected['data'][number]>(curr.data);
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

	function willOverflowHousingSpace(troop: Omit<Selected, 'amount'>) {
		const selectedCopy: Selected[] = JSON.parse(JSON.stringify(selected));
		const selectedPreview = add(troop, selectedCopy);
		const { troops, sieges, spells } = getSelectedTotals(selectedPreview);
		return troops > maxHousingSpace.troops || sieges > maxHousingSpace.sieges || spells > maxHousingSpace.spells;
	}

	// TODO: add warning somewhere that max limit reached (title on asset display/icon in capacity bar??)
</script>

<svelte:head>
	<title>ClashArmies • Create Army</title>
</svelte:head>

<svelte:window
	on:mouseup={() => {
		// handle this on window in case user mouses cursor from the
		// card (maybe we should stop adding/removing if mouse leaves card?)
		stopHoldAdd();
		stopHoldRemove();
	}}
/>

<div class="alert">
	<div class="container">
		<Alert>
			Clan castle troops/spells, pets, heroes and hero equipment must be manually edited in game after opening the army via the generated link. Hopefully one
			day Supercell allows this!
		</Alert>
	</div>
</div>

<section class="troops">
	<div class="container">
		<h2 class="heading"><span>1</span> Troops</h2>
		<ul class="grid">
			{#each selectedTroops as troop}
				{@const { type, name, amount, data } = troop}
				<li>
					<button class="object-card" on:mousedown={() => initHoldRemove(troop.name)}>
						<AssetDisplay {type} {name} {amount} {data} />
					</button>
				</li>
			{/each}
			{#each Array.from({ length: ARMY_CREATE_TROOP_FILLER - selectedTroops.length > 0 ? ARMY_CREATE_TROOP_FILLER - selectedTroops.length : 0 }) as filler}
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
				{@const troop = { type: 'Troop', name, data } as const}
				{@const level = getTroopLevel(name, app)}
				{@const reachedMaxAmount = willOverflowHousingSpace(troop)}
				<!-- Disable if reached max unique super limit of 2 and this troop isn't one of those -->
				<!-- TOOD: fix data[1].isSuper, properties like isSuper that apply to all levels should not live in level data -->
				{@const disableSuper = data[1].isSuper && !selected.find(sel => sel.name === troop.name) && reachedSuperLimit}
				<li>
					<button
						class="picker-card"
						disabled={reachedMaxAmount || disableSuper || level === -1}
						on:mousedown={() => initHoldAdd(troop)}
					>
						<AssetDisplay type="Troop" {name} {data} {level} />
					</button>
				</li>
			{/each}
		</ul>
		<h3>Select siege machine</h3>
		<ul class="picker-grid">
			<!-- prettier-ignore -->
			{#each (Object.entries(app.sieges) as [SiegeName, SiegeData][]) as [name, data]}
				{@const siege = { type: 'Siege', name, data } as const}
				{@const level = getSiegeLevel(name, app)}
				{@const reachedMaxAmount = willOverflowHousingSpace(siege)}
				<li>
					<button
						class="picker-card"
						disabled={reachedMaxAmount || level === -1}
						on:mousedown={() => initHoldAdd(siege)}
					>
						<AssetDisplay type="Siege" {name} {data} {level} />
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
			{#each selectedSpells as spell}
				{@const { type, name, amount, data } = spell}
				<li>
					<button class="object-card" on:mousedown={() => initHoldRemove(spell.name)}>
						<AssetDisplay {type} {name} {amount} {data} />
					</button>
				</li>
			{/each}
			{#each Array.from({ length: ARMY_CREATE_SPELL_FILLER - selectedSpells.length > 0 ? ARMY_CREATE_SPELL_FILLER - selectedSpells.length : 0 }) as filler}
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
				{@const spell = { type: 'Spell', name, data } as const}
				{@const level = getSpellLevel(name, app)}
				{@const reachedMaxAmount = willOverflowHousingSpace(spell)}
				<li>
					<button
						class="picker-card"
						disabled={reachedMaxAmount || level === -1}
						on:mousedown={() => initHoldAdd(spell)}
					>
						<AssetDisplay type="Spell" {name} {data} {level} />
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
				disabled={!selected.length}
				title={!selected.length
					? 'Army cannot be shared when empty'
					: "Copies an army link to your clipboard for sharing.\nNote: may not work if the army isn't at full capacity"}
			>
				Share
			</Button>
			<Button
				onclick={openInGame}
				disabled={!selected.length}
				title={!selected.length
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

	.troops,
	.spells {
		padding: 50px var(--side-padding);
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
