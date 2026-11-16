<script lang="ts">
	import { getContext } from 'svelte';
	import { unitImgURL } from '#client/assets.ts';
	import type { Unit } from '#shared/gameData.ts';
	import type { AppState } from '#types';

	type Props = {
		unit: Unit;
		/**
		 * Title to use for the card
		 * @default props.name
		 */
		title?: string;
		/**
		 * Whether to display card as inline or a block style
		 * @default 'inline'
		 */
		display?: 'inline' | 'block';
		level?: number;
		amount?: number;
	};
	const { unit, display, level, amount, title }: Props = $props();
	const app = getContext<AppState>('app');
	const { name, type, isSuper, isSquad } = $derived(unit);

	const defaultTitle = $derived.by(() => {
		if (!isSquad) {
			return name;
		}
		const members = unit.squadMembers.map((m) => `${m.amount}x ${app.gameData.index.units.byId(m.unitId)?.name}`);
		return `${name} (${members.join(', ')})`;
	});
	const levels = $derived(app.gameData.index.units.byName(name)?.levels ?? []);
	const isMaxLevel = $derived(level === Math.max(...levels.map((x) => x.level)));
</script>

<div class="unit-display {display} {type} {isSuper ? 'Super' : ''} {isSquad ? 'Squad' : ''}" title={title ?? defaultTitle}>
	{#if amount}
		<b class="unit-amount {display}">x{amount}</b>
	{/if}
	{#if level && level > 0}
		<b class="unit-lvl" class:max-lvl={isMaxLevel}>{level}</b>
	{/if}
	<img class="unit-img" src={unitImgURL(name, 'small')} alt="{type}: {name}" />
</div>

<style>
	.unit-display {
		position: relative;
		display: flex;
		flex-flow: column nowrap;
		align-items: center;
		border-radius: 6px;
		overflow: hidden;
		height: 100%;
		width: 100%;
		user-select: none;
		background: radial-gradient(ellipse 85% 75% at 50% 58%, var(--card-centre) 0%, var(--card-edge) 100%);
	}

	.unit-display.Troop,
	.unit-display.Siege {
		--card-centre: hsl(203, 100%, 66%);
		--card-edge: hsl(207, 64%, 45%);
		--amount-top: rgb(78, 146, 210);
		--amount-bottom: rgb(57, 110, 164);
		background-color: #60a7d8;
	}

	.unit-display.Spell {
		--card-centre: hsl(252, 68%, 62%);
		--card-edge: hsl(251, 65%, 57%);
		--amount-top: rgb(125, 93, 226);
		--amount-bottom: rgb(77, 62, 167);
		background-color: #655fd0;
	}

	.unit-display.Super {
		--card-centre: hsl(2, 45%, 47%);
		--card-edge: hsl(357, 51%, 27%);
		--amount-top: rgb(133, 13, 19);
		--amount-bottom: rgb(114, 48, 53);
		background-color: #a2283f;
	}

	.unit-display.Squad {
		--card-centre: hsl(100, 55%, 56%);
		--card-edge: hsl(103, 45%, 38%);
		--amount-top: rgb(103, 160, 75);
		--amount-bottom: rgb(76, 120, 59);
		background-color: #61b63a;
	}

	.unit-display.block {
		border-radius: 6px;
	}

	.unit-img {
		pointer-events: none;
		display: block;
		height: var(--unit-size, 100%);
		width: var(--unit-size, 100%);
	}

	.unit-amount {
		font-family: 'Clash', sans-serif;
		-webkit-text-stroke: var(--txt-stroke-dark);
		text-shadow: var(--txt-shadow-dark);
		color: var(--grey-100);
		position: absolute;
		font-size: var(--unit-amount-size, 2em);
		left: 4px;
		top: 4px;
	}

	.unit-amount.block {
		position: initial;
		text-align: center;
		text-shadow: none;
		padding: 3px 0 1.5px 0;
		width: 100%;
		background-color: var(--amount-bottom);
		background-image: linear-gradient(0deg, var(--amount-bottom) 0%, var(--amount-top) 100%);
	}

	.unit-lvl {
		font-family: 'Clash', sans-serif;
		-webkit-text-stroke: var(--txt-stroke-dark);
		text-shadow: var(--txt-shadow-dark);
		background-color: var(--grey-700);
		color: var(--grey-100);
		position: absolute;
		border-radius: 4px;
		font-size: var(--unit-lvl-size, 0.75em);
		padding: 3px;
		bottom: 4px;
		left: 4px;
	}

	.unit-lvl.max-lvl {
		text-shadow: var(--txt-shadow);
		background-color: #f5ab3d;
	}
</style>
