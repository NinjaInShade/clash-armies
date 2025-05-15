<script lang="ts">
	import type { PageData } from './$types';
	import type { AppState } from '$types';
	import { ArmyModel } from '$models';
	import { getContext, untrack } from 'svelte';
	import C from '$components';

	const { data }: { data: PageData } = $props();
	const app = getContext<AppState>('app');
	const armies = $derived(
		data.armies.map((army) => {
			return untrack(() => new ArmyModel(app, army));
		})
	);

	const ENTRIES_PER_PAGE = 25;
	let page = $state<number>(1);

	let armyFiltersRef = $state<C.ArmyFilters>();
	let filteredArmies = $state<ArmyModel[] | null>(null);
	let displayArmies = $derived((filteredArmies ?? []).slice(0, page * ENTRIES_PER_PAGE));

	function resetFilters() {
		if (!armyFiltersRef) return;
		armyFiltersRef.resetAllFilters();
	}

	function loadMore() {
		page += 1;
	}
</script>

<svelte:head>
	<title>ClashArmies • Find Armies</title>
	<link rel="canonical" href="https://clasharmies.com/armies" />
	<meta
		name="description"
		content="Browse hundreds of user-created Clash of Clans armies. Filter by town hall, strategy, troop types, and more to find the perfect attack for any war or farming goal."
	/>
</svelte:head>

<section class="armies">
	<div class="container">
		<C.ArmyFilters {armies} bind:filteredArmies bind:this={armyFiltersRef} />
		{#if filteredArmies === null}
			<div class="spinner-container">
				<span class="spinner"></span>
			</div>
		{:else}
			<ul class="armies-grid">
				{#each displayArmies as model (model.id)}
					<C.ArmyCard {model} />
				{/each}
			</ul>
			{#if displayArmies.length && displayArmies.length < filteredArmies.length}
				<C.Button onClick={loadMore} style="display: block; margin: 24px auto 0 auto;">Load more...</C.Button>
			{/if}

			{#if !displayArmies.length}
				<div class="no-data">
					<img src="/clash/ui/pekka.png" alt="PEKKA" />
					<h2>There are no armies matching this criteria warrior!</h2>
					<C.Button onClick={resetFilters}>Reset all filters</C.Button>
				</div>
			{/if}
		{/if}
	</div>
</section>

<style>
	.armies {
		padding: 32px var(--side-padding);
		flex: 1 0 0px;
	}

	.armies .container {
		display: flex;
		flex-flow: column nowrap;
		height: 100%;
	}

	.armies-grid {
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: auto;
		margin-top: 1em;
		gap: 0.5em;
	}

	.no-data {
		display: flex;
		justify-content: center;
		align-items: center;
		flex-flow: column nowrap;
		background-color: var(--grey-800);
		border-radius: 8px;
		padding: 2em 1em;
		flex: 1 0 0px;
	}

	.no-data h2 {
		max-width: 450px;
		text-align: center;
		font-size: var(--h2);
		line-height: var(--h2-lh);
		font-weight: 400;
		margin: 1em 0 0.75em 0;
	}

	.no-data img {
		max-width: 550px;
		width: 100%;
	}

	.spinner-container {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-top: 1em;
		flex: 1 0 0px;
	}
	.spinner {
		width: 24px;
		height: 24px;
		border: 5px solid var(--grey-500);
		border-bottom-color: transparent;
		border-radius: 50%;
		display: inline-block;
		box-sizing: border-box;
		animation: rotation 1s linear infinite;
	}

	@keyframes rotation {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 550px) {
		.no-data img {
			max-width: 100%;
		}
	}

	@media (max-width: 450px) {
		:global(.filters fieldset) {
			--input-width: 100%;
			width: 100%;
		}

		:global(.filters .sort-control) {
			grid-column: 1 / span 2;
		}
	}

	@media (max-width: 425px) {
		.armies {
			padding-top: 32px;
		}
	}
</style>
