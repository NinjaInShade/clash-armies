<script lang="ts">
	import { getContext } from 'svelte';
	import type { AppState, TroopName, TroopData, SpellName, SpellData, SiegeName, SiegeData, Selected, HousingSpace, SelectedTotals } from '~/lib/types';
	import { ARMY_CREATE_TROOP_FILLER, ARMY_CREATE_SPELL_FILLER } from '~/lib/constants';
	import Alert from '~/components/Alert.svelte';
	import AssetDisplay from '~/components/AssetDisplay.svelte';
	import Button from '~/components/Button.svelte';

	const app = getContext<AppState>('app');

	let selected = $state<Selected[]>([]);
	let selectedTroops = $derived(selected.filter((item) => item.type === 'Troop' || item.type === 'Siege'));
	let selectedSpells = $derived(selected.filter((item) => item.type === 'Spell'));

	let maxHousingSpace: HousingSpace = { troops: 320, spells: 11, sieges: 1 }; // TODO: calculate dynamically
	let housingSpaceUsed = $derived.call(getSelectedTotals);

	function add(troop: Omit<Selected, 'amount'>, arr: Selected[] = selected) {
		const existing = arr.find((item) => item.name === troop.name);
		if (existing) {
			existing.amount += 1;
		} else {
			arr.push({ ...troop, amount: 1 });
		}
		return arr;
	}

	function remove(name: Selected['name']) {
		const existingIndex = selected.findIndex((item) => item.name === name);
		if (selected[existingIndex].amount === 1) {
			selected.splice(existingIndex, 1);
		} else {
			selected[existingIndex].amount -= 1;
		}
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
	// TODO: allow no more than two types of super troops
</script>

<svelte:head>
	<title>ClashArmies • Create Army</title>
</svelte:head>

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
					<button
						class="object-card"
						onclick={() => {
							if (!troop) {
								console.error('Expected troop, what happened?');
								return;
							}
							remove(troop.name);
						}}
					>
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
				{@const reachedMaxAmount = willOverflowHousingSpace(troop)}
				{@const addTroop = () => add(troop)}
				<li>
					<button
						class="picker-card"
						onclick={addTroop}
						disabled={reachedMaxAmount}
					>
						<AssetDisplay type="Troop" {name} {data} />
					</button>
				</li>
			{/each}
		</ul>
		<h3>Select siege machine</h3>
		<ul class="picker-grid">
			<!-- prettier-ignore -->
			{#each (Object.entries(app.sieges) as [SiegeName, SiegeData][]) as [name, data]}
				{@const siege = { type: 'Siege', name, data } as const}
				{@const reachedMaxAmount = willOverflowHousingSpace(siege)}
				{@const addSiege = () => add(siege)}
				<li>
					<button
						class="picker-card"
						onclick={addSiege}
						disabled={reachedMaxAmount}
					>
						<AssetDisplay type="Siege" {name} {data} />
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
					<button
						class="object-card"
						onclick={() => {
							if (!spell) {
								console.error('Expected spell, what happened?');
								return;
							}
							remove(spell.name);
						}}
					>
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
				{@const reachedMaxAmount = willOverflowHousingSpace(spell)}
				{@const addSpell = () => add(spell)}
				<li>
					<button
						class="picker-card"
						onclick={addSpell}
						disabled={reachedMaxAmount}
					>
						<AssetDisplay type="Spell" {name} {data} />
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
