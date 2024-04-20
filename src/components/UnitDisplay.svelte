<script lang="ts">
	import type { TroopName, TroopData, SiegeName, SiegeData, SpellName, SpellData } from '~/lib/types';

	type Props = {
		type: 'Troop' | 'Siege' | 'Spell';
		name: TroopName | SiegeName | SpellName;
		data: TroopData | SiegeData | SpellData;
		/**
		 * Title to use for the card
		 * @default props.name
		 */
		title?: string;
		amount?: number;
		level?: number;
	};
	const { type, name, amount, level, title, data } = $props<Props>();

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

	function isMaxLevel() {
		const dataKeys = Object.keys(data);
		return level === +dataKeys[dataKeys.length - 1];
	}
</script>

<div class="asset-bg" title={title ?? name}>
	{#if amount}
		<b class="asset-amount">{amount}</b>
	{/if}
	{#if level && level > 0}
		<b class="asset-lvl" class:max-lvl={isMaxLevel()}>{level}</b>
	{/if}
	<img class="asset-img" src="/clash/{types[type].assetDir}/{name}.png" alt="{name} {types[type].altSuffix}" />
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
		pointer-events: none;
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

	.asset-lvl {
		font-family: 'Clash', sans-serif;
		-webkit-text-stroke: var(--txt-stroke-dark);
		text-shadow: var(--txt-shadow-dark);
		background-color: var(--grey-700);
		color: var(--grey-100);
		position: absolute;
		border-radius: 4px;
		font-size: 0.75em;
		padding: 3px;
		bottom: 4px;
		left: 4px;
	}

	.asset-lvl.max-lvl {
		text-shadow: var(--txt-shadow);
		background-color: #f5ab3d;
	}
</style>
