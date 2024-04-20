<script lang="ts">
	import type { Troop, TroopName, Siege, SiegeName, Spell, SpellName } from '~/lib/state.svelte';

	type Props = {
		type: 'Troop' | 'Siege' | 'Spell';
		name: TroopName | SiegeName | SpellName;
		data: Troop | Siege | Spell;
		amount?: number;
	};
	let { type, name, amount, data } = $props<Props>();

	const types = {
		Troop: {
			assetDir: 'troops',
			altSuffix: 'troop'
		},
		Siege: {
			assetDir: 'troops',
			altSuffix: 'siege machine'
		},
		Spell: {
			assetDir: 'spells',
			altSuffix: 'spell'
		}
	};
	const assetDir = types[type].assetDir;
	const altSuffix = types[type].altSuffix;
</script>

<div class="asset-bg" title={name}>
	{#if amount}
		<b class="asset-amount">{amount}</b>
	{/if}
	<img class="asset-img" src="/clash/{assetDir}/{name}.png" alt="{name} {altSuffix}" />
</div>

<style>
	.asset-bg {
		position: relative;
		display: flex;
		align-items: flex-end;
		background-color: #60a7d8;
		border-radius: 6px;
		height: 100%;
		width: 100%;
	}

	.asset-img {
		display: block;
		height: 100%;
		width: 100%;
	}

	.asset-amount {
		font-family: 'Clash', sans-serif;
		-webkit-text-stroke: var(--txt-stroke-dark);
		text-shadow: var(--txt-shadow-dark);
		color: var(--grey-100);
		position: absolute;
		font-size: 2em;
		left: 4px;
		top: 4px;
	}
</style>
