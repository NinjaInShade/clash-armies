<script lang="ts">
	import { getContext } from 'svelte';
	import type { AppState, Unit } from '$types';

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
	const { name, type, isSuper } = $derived(unit);
	const levels = $derived(app.units.find((u) => u.name === name)?.levels ?? []);
	const isMaxLevel = $derived(level === Math.max(...levels.map((x) => x.level)));
</script>

<div class="unit-display {display} {type} {isSuper ? 'Super' : ''}" title={title ?? name}>
	{#if amount}
		<b class="unit-amount {display}">x{amount}</b>
	{/if}
	{#if level && level > 0}
		<b class="unit-lvl" class:max-lvl={isMaxLevel}>{level}</b>
	{/if}
	<img class="unit-img" src="/clash/units/{name}_small.webp" alt="{type}: {name}" />
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
	}

	.unit-display.Troop,
	.unit-display.Siege {
		background-color: #60a7d8;
	}

	.unit-display.Spell {
		background-color: #655fd0;
	}

	.unit-display.Super {
		background-color: #a2283f;
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
	}

	.Troop .unit-amount.block,
	.Siege .unit-amount.block {
		background: rgb(57, 110, 164);
		background: linear-gradient(0deg, rgba(57, 110, 164, 1) 0%, rgba(78, 146, 210, 1) 100%);
	}

	.Spell .unit-amount.block {
		background: rgb(77, 62, 167);
		background: linear-gradient(0deg, rgba(77, 62, 167, 1) 0%, rgba(125, 93, 226, 1) 100%);
	}

	.Super .unit-amount.block {
		background: rgb(114 48 53);
		background: linear-gradient(0deg, rgb(114 48 53) 0%, rgba(133, 13, 19, 1) 100%);
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
