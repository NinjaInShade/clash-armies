<script lang="ts">
	import type { UnitLevel, UnitType } from '~/lib/shared/types';

	type Props = {
		name: string;
		type: UnitType;
		levels: UnitLevel[];
		/**
		 * Title to use for the card
		 * @default props.name
		 */
		title?: string;
		amount?: number;
		level?: number;
	};
	const { type, name, amount, level, title, levels } = $props<Props>();

	function isMaxLevel() {
		return level === Math.max(...levels.map((x) => x.level));
	}
</script>

<div class="unit-display" title={title ?? name}>
	{#if amount}
		<b class="unit-amount">{amount}</b>
	{/if}
	{#if level && level > 0}
		<b class="unit-lvl" class:max-lvl={isMaxLevel()}>{level}</b>
	{/if}
	<img class="unit-img" src="/clash/units/{name}.png" alt="{type}: {name}" />
</div>

<style>
	.unit-display {
		position: relative;
		display: flex;
		align-items: flex-end;
		background-color: #60a7d8;
		border-radius: 10px;
		overflow: hidden;
		height: 100%;
		width: 100%;
	}

	.unit-img {
		pointer-events: none;
		display: block;
		height: 100%;
		width: 100%;
	}

	.unit-amount {
		font-family: 'Clash', sans-serif;
		-webkit-text-stroke: var(--txt-stroke-dark);
		text-shadow: var(--txt-shadow-dark);
		color: var(--grey-100);
		position: absolute;
		font-size: 2em;
		left: 4px;
		top: 4px;
	}

	.unit-lvl {
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

	.unit-lvl.max-lvl {
		text-shadow: var(--txt-shadow);
		background-color: #f5ab3d;
	}
</style>
