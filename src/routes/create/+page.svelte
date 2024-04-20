<script lang="ts">
	import { getContext } from 'svelte';
	import type { AppState, TroopName, TroopData, SpellName, SpellData, SiegeName, SiegeData } from '~/lib/state.svelte';
	import Alert from '~/components/Alert.svelte';
	import AssetDisplay from '~/components/AssetDisplay.svelte';

	const app = getContext<AppState>('app');
	const TROOP_FILL = 20;
	const SPELL_FILL = 10;

	type Selected = {
		type: 'Troop' | 'Siege' | 'Spell';
		name: TroopName | SiegeName | SpellName;
		data: TroopData | SiegeData | SpellData;
		amount: number;
	};
	let selected = $state<Selected[]>([]);
	let selectedTroops = $derived(selected.filter((item) => item.type === 'Troop' || item.type === 'Siege'));
	let selectedSpells = $derived(selected.filter((item) => item.type === 'Spell'));
	let siegesDisabled = $derived(Boolean(selectedTroops.find((x) => x.type === 'Siege')));

	function add(type: Selected['type'], name: Selected['name'], data: Selected['data']) {
		const existing = selected.find((item) => item.name === name);
		if (existing) {
			existing.amount += 1;
		} else {
			selected.push({
				type,
				name,
				data,
				amount: 1
			});
		}
	}

	function remove(name: Selected['name']) {
		const existingIndex = selected.findIndex((item) => item.name === name);
		if (selected[existingIndex].amount === 1) {
			selected.splice(existingIndex, 1);
		} else {
			selected[existingIndex].amount -= 1;
		}
	}
</script>

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
			{#each Array.from({ length: TROOP_FILL - selectedTroops.length > 0 ? TROOP_FILL - selectedTroops.length : 0 }) as filler}
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
				<li>
					<button class="picker-card" onclick={() => add('Troop', name, app.troops[name])}>
						<AssetDisplay type="Troop" {name} {data} />
					</button>
				</li>
			{/each}
		</ul>
		<h3>Select siege machine</h3>
		<ul class="picker-grid">
			<!-- prettier-ignore -->
			{#each (Object.entries(app.sieges) as [SiegeName, SiegeData][]) as [name, data]}
				<li>
					<button class="picker-card" onclick={() => add('Siege', name, app.sieges[name])} disabled={siegesDisabled}>
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
			{#each Array.from({ length: SPELL_FILL - selectedSpells.length > 0 ? SPELL_FILL - selectedSpells.length : 0 }) as filler}
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
				<li>
					<button class="picker-card" onclick={() => add('Spell', name, app.spells[name])}>
						<AssetDisplay type="Spell" {name} {data} />
					</button>
				</li>
			{/each}
		</ul>
	</div>
</section>

<style>
	.alert {
		padding: 50px var(--side-padding) 0 var(--side-padding);
	}

	.troops,
	.spells {
		padding: 50px var(--side-padding);
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
