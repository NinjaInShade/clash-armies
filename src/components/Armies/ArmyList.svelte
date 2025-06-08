<script lang="ts">
	import type { Army } from '$models';
	import { getContext, untrack } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import type { AppState } from '$types';
	import Button from '../Button.svelte';
	import ArmyCard from '../ArmyCard.svelte';
	import Banner from './Banner.svelte';
	import Controls from './Controls.svelte';
	import { ArmyModel } from '$models';

	type BannerOptions = {
		title: string;
		description: string;
		descriptionWidth: number;
		img: string;
		imgAlt: string;
	};
	type Props = {
		data: Army[];
		bannerOptions?: BannerOptions;
		/**
		 * How many armies to show per "page".
		 * Once this limit is hit the user can click a button to display more.
		 * @default 10
		 */
		armiesPerPage?: number;
		allowSearch?: boolean;
		allowTHFilter?: boolean;
		allowFilters?: boolean;
	};
	const { data, bannerOptions, armiesPerPage = 10, allowSearch = false, allowTHFilter = false, allowFilters = false }: Props = $props();
	const app = getContext<AppState>('app');
	const armies = $derived.by(() => {
		return data.map((army) => {
			return untrack(() => new ArmyModel(app, army));
		});
	});

	let controlsRef = $state<Controls>();
	let pageNumber = $state<number>(getInitialPageNumber());
	let filteredArmies = $state<ArmyModel[] | null>(null);
	let displayArmies = $derived.by(() => (filteredArmies ?? []).slice(0, pageNumber * armiesPerPage));

	function getInitialPageNumber() {
		const pageParam = page.url.searchParams.get('page');
		if (!pageParam || Number.isNaN(+pageParam)) {
			return 1;
		}
		return +pageParam;
	}

	async function loadMore() {
		pageNumber += 1;
		page.url.searchParams.set('page', String(pageNumber));
		await goto(`?${page.url.searchParams.toString()}`, {
			replaceState: true,
			noScroll: true,
			keepFocus: true,
		});
	}

	function resetFilters() {
		controlsRef?.resetAllFilters();
	}
</script>

<div class="army-list">
	{#if bannerOptions}
		{@const { title, description, descriptionWidth, img, imgAlt } = bannerOptions}
		<Banner {title} {description} {descriptionWidth} {img} {imgAlt} style="margin-bottom: 10px" />
	{/if}

	<div class="controls">
		<Controls bind:this={controlsRef} {armies} bind:filteredArmies {allowSearch} {allowTHFilter} {allowFilters} />
	</div>

	{#if filteredArmies === null}
		<div class="spinner-container">
			<span class="spinner"></span>
		</div>
	{:else}
		<ul class="armies-list">
			{#each displayArmies as model (model.id)}
				<ArmyCard {model} />
			{/each}
		</ul>

		{#if displayArmies.length && displayArmies.length < filteredArmies.length}
			<Button onClick={loadMore} style="display: block; margin: 16px auto 0 auto;">Load more</Button>
		{/if}

		{#if !displayArmies.length}
			<div class="no-data">
				<img src="/clash/ui/pekka.png" alt="PEKKA" />
				<h2>There are no armies matching this criteria warrior!</h2>
				<div class="reset-filters">
					<Button onClick={resetFilters}>Reset all filters</Button>
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.controls:not(:empty) {
		margin-top: 10px;
	}

	.reset-filters {
		display: none;
	}

	.army-list:has(.controls:not(:empty)) .reset-filters {
		display: block;
	}

	.armies-list {
		display: flex;
		flex-flow: column nowrap;
		margin-top: 10px;
		gap: 10px;
	}

	.spinner-container {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-top: 24px;
		flex: 1 0 0px;

		& .spinner {
			width: 24px;
			height: 24px;
			border: 5px solid var(--grey-500);
			border-bottom-color: transparent;
			border-radius: 50%;
			display: inline-block;
			box-sizing: border-box;
			animation: spin 1s linear infinite;
		}
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

		& h2 {
			max-width: 450px;
			text-align: center;
			font-size: var(--h2);
			line-height: var(--h2-lh);
			font-weight: 400;
			margin: 1em 0 0.75em 0;
		}

		& img {
			max-width: 550px;
			width: 100%;

			@media (max-width: 550px) {
				max-width: 100%;
			}
		}
	}
</style>
