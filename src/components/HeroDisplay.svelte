<script lang="ts">
	import type { AppState, HeroType } from '$types';
	import { getContext } from 'svelte';
	import { ArmyModel } from '$models';

	type Props = {
		name: HeroType;
		level?: number;
	};
	const { name, level }: Props = $props();

	const app = getContext<AppState>('app');
	const levels = $derived(app.townHalls.map((th) => ArmyModel.getMaxHeroLevel(name, th.level, app)));
	const isMaxLevel = $derived(level === Math.max(...levels));
</script>

<div class="display {name.replaceAll(' ', '-').toLowerCase()}" title={name}>
	{#if level && level > 0}
		<b class="lvl" class:max={isMaxLevel}>{level}</b>
	{/if}
	<img src="/heroes/{name} Full Height.webp" alt={`Clash of clans "${name}" hero`} />
</div>

<style>
	.display {
		position: relative;
		display: flex;
		flex-flow: column nowrap;
		align-items: center;
		border-radius: 6px;
		overflow: hidden;
		user-select: none;
		height: fit-content;
		background-color: #3d3d3d;
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
		width: var(--hero-width, 100%);
		height: var(--hero-height, 100%);
	}
</style>
