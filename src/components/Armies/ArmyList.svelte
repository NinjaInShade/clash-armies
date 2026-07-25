<script lang="ts">
	import type { Army } from '$models';
	import { getContext, untrack, type Snippet } from 'svelte';
	import type { AppState } from '$types';
	import Button from '../Button.svelte';
	import ArmyCard from '../ArmyCard.svelte';
	import Banner, { type BannerOptions } from './Banner.svelte';
	import Controls from './Controls.svelte';
	import { ArmyModel } from '$models';
	import Pagination from './Pagination.svelte';
	import { mkPageStore } from '$client/params.svelte';
	import { ARMIES_PAGE_SIZE } from '$shared/utils';
	import ImgPekka from '$assets/ui/pekka.webp';

	type Props = {
		/** Armies to display in the list */
		data: Army[];
		/** Total number of armies matching the current filters, across all pages */
		total: number;
		/** Optional and customisable banner to display above the army list */
		bannerOptions?: BannerOptions;
		/**
		 * Whether to show a search box to further filter results.
		 * @default false
		 */
		allowSearch?: boolean;
		/**
		 * Whether to show a town hall filter control.
		 * @default false
		 */
		allowTHFilter?: boolean;
		/**
		 * Whether to show the filters button that opens up an advanced filtering popup.
		 * @default false
		 */
		allowFilters?: boolean;
		/**
		 * Where to scroll to when paginating.
		 *   - `"page-top"`: scrolls to the very top of the page - suited to pages where the army
		 *     list is essentially the whole page (e.g. `/armies/popular`).
		 *   - `number`: scrolls to the army list's own position, offset upward by this many
		 *     pixels so it isn't flush against the viewport edge - suited to pages where the list
		 *     is embedded further down, under other content (e.g. the homepage's hero section).
		 * @default 'page-top'
		 */
		paginationScrollTarget?: 'page-top' | number;
		/**
		 * The URL search param key used to track the current page number.
		 *
		 * Useful when multiple `ArmyList`s can be active on the same URL
		 * at once (e.g. tabs) so their pagination state doesn't collide.
		 *
		 * @default "page"
		 */
		pageParam?: string;
		/**
		 * Custom content to show instead of the default "no results" state when there's nothing to display.
		 *
		 * Useful outside a search/filters context (e.g. a fixed list), where the default filter
		 * oriented messaging ("no armies matching this criteria" + reset filters) doesn't apply.
		 */
		emptyState?: Snippet;
	};
	const {
		data,
		total,
		bannerOptions,
		allowSearch = false,
		allowTHFilter = false,
		allowFilters = false,
		paginationScrollTarget = 'page-top',
		pageParam = 'page',
		emptyState,
	}: Props = $props();

	const app = getContext<AppState>('app');

	const armies = $derived.by(() => {
		return data.map((army) => {
			return untrack(() => new ArmyModel(app, army));
		});
	});

	let controlsRef = $state<Controls>();
	let listRef = $state<HTMLUListElement>();

	const pageStore = mkPageStore(pageParam);
	const currentPage = $derived(pageStore.value);
	// Currently `ARMIES_PAGE_SIZE` is fixed since every server fetch call limits
	// by this, but if we wanted more flexibility this design could be reconsidered.
	const totalPages = $derived(Math.max(1, Math.ceil(total / ARMIES_PAGE_SIZE)));
	let previousPage = $state(currentPage);

	$effect(() => {
		if (currentPage !== previousPage) {
			previousPage = currentPage;
			if (paginationScrollTarget === 'page-top') {
				window.scrollTo({ top: 0 });
			} else {
				// `scroll-margin-top` (set inline below) supplies the offset here, rather than manually combining
				// `getBoundingClientRect()` + `window.scrollY`, which can drift inconsistently on mobile due to
				// some browser's collapsible address bars resizing the viewport mid-scroll.
				listRef?.scrollIntoView({ block: 'start' });
			}
		}
	});

	function resetPage() {
		pageStore.value = 1;
	}

	function resetFilters() {
		controlsRef?.resetAllFilters();
	}
</script>

<div class="army-list">
	{#if bannerOptions}
		<Banner {...bannerOptions} style="margin-bottom: 10px" />
	{/if}

	<div class="controls">
		<Controls bind:this={controlsRef} {allowSearch} {allowTHFilter} {allowFilters} />
	</div>

	<ul class="armies-list" bind:this={listRef} style={typeof paginationScrollTarget === 'number' ? `scroll-margin-top: ${paginationScrollTarget}px` : undefined}>
		{#each armies as model (model.id)}
			<ArmyCard {model} />
		{/each}
	</ul>

	{#if !armies.length}
		{#if total > 0}
			<div class="no-data">
				<img src={ImgPekka} alt="PEKKA" />
				<h2>This page doesn't exist anymore warrior!</h2>
				<div class="reset-filters">
					<Button onClick={resetPage}>Back to page 1</Button>
				</div>
			</div>
		{:else if emptyState}
			{@render emptyState()}
		{:else}
			<div class="no-data">
				<img src={ImgPekka} alt="PEKKA" />
				<h2>There are no armies matching this criteria warrior!</h2>
				<div class="reset-filters">
					<Button onClick={resetFilters}>Reset all filters</Button>
				</div>
			</div>
		{/if}
	{/if}

	<Pagination {totalPages} {pageParam} />
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
