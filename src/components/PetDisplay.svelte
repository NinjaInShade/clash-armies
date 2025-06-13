<script lang="ts">
	import { getContext } from 'svelte';
	import type { AppState } from '$types';

	type Props = {
		name: string;
		/**
		 * Title to use for the card
		 * @default props.name
		 */
		title?: string;
		amount?: number;
		level?: number;
	};
	const { name, amount, level, title }: Props = $props();
	const app = getContext<AppState>('app');
	const levels = $derived(app.pets.find((p) => p.name === name)?.levels ?? []);
	const isMaxLevel = $derived(level === Math.max(...levels.map((x) => x.level)));
</script>

<div class="display" title={title ?? name}>
	{#if amount}
		<b class="amount">x{amount}</b>
	{/if}
	{#if level && level > 0}
		<b class="lvl" class:max={isMaxLevel}>{level}</b>
	{/if}
	<img src="/heroes/pets/{name}.webp" alt={name} />
</div>

<style>
	.display {
		position: relative;
		display: flex;
		flex-flow: column nowrap;
		align-items: center;
		border-radius: 6px;
		overflow: hidden;
		height: 100%;
		width: 100%;
		user-select: none;
		background-color: #3d3d3d;
	}

	.amount {
		font-family: 'Clash', sans-serif;
		-webkit-text-stroke: var(--txt-stroke-dark);
		text-shadow: var(--txt-shadow-dark);
		color: var(--grey-100);
		position: absolute;
		font-size: var(--unit-amount-size, 2em);
		left: 4px;
		top: 4px;
	}

	.lvl {
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
	.lvl.max {
		text-shadow: var(--txt-shadow);
		background-color: #f5ab3d;
	}

	img {
		pointer-events: none;
		display: block;
		height: var(--unit-size, 100%);
		width: var(--unit-size, 100%);
	}
</style>
