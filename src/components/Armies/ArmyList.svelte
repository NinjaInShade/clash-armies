<script lang="ts">
	import type { Army } from '$models/Army.svelte';
	import { getContext, untrack, type Snippet, type ComponentProps } from 'svelte';
	import { navigating, page } from '$app/state';
	import type { AppState } from '$types';
	import Button from '../Button.svelte';
	import ArmyCard from '../ArmyCard.svelte';
	import Banner, { type BannerOptions } from './Banner.svelte';
	import { ArmyModel } from '$models/Army.svelte';
	import Pagination from './Pagination.svelte';
	import { mkParamStore, mkPageStore } from '$client/params.svelte';
	import SearchBox from './SearchBox.svelte';
	import { debounce, ARMIES_PAGE_SIZE } from '$shared/utils';
	import FiltersDrawer from '$components/Armies/FiltersDrawer.svelte';
	import THFilterButton from '$components/Armies/THFilterButton.svelte';
	import { createFiltersState } from '$client/filtersState.svelte';
	import ImgPekka from '$assets/ui/pekka.webp';

	type FiltersDrawerProps = ComponentProps<typeof FiltersDrawer>;

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
		 * Whether to show the filters drawer and what filters are enabled.
		 * Accepted values:
		 *   - undefined: no filters drawer is shown
		 *   - true: all filters are shown
		 *   - object of `FiltersDrawer` props: customise exactly what the filters drawer shows
		 * @default undefined
		 */
		allowFilters?: true | Omit<FiltersDrawerProps, 'filters' | 'open'>;
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
		allowFilters,
		paginationScrollTarget = 'page-top',
		pageParam = 'page',
		emptyState,
	}: Props = $props();

	const SET_SEARCH_DEBOUNCE_MS = 500;
	/**
	 * Show loading spinner when data is loading after this amount of milliseconds.
	 * Helpful for slower networks, so the user gets an indication that data is loading.
	 */
	const LOADING_SPINNER_DELAY_MS = 300;

	const app = getContext<AppState>('app');

	const armies = $derived.by(() => {
		return data.map((army) => {
			return untrack(() => new ArmyModel(app, army));
		});
	});

	let listRef = $state<HTMLUListElement>();

	const filters = createFiltersState(app, pageParam);
	let filtersOpen = $state(false);

	// Mirrors `FiltersDrawer` own default (it shows TH filter on desktop, but on mobile the list shows it inline for convenience)
	const showTHFilter = $derived(allowFilters === true ? true : (allowFilters?.showTHFilter ?? true));
	// On mobile the TH filter is shown inline, not in `FiltersDrawer`, so it shouldn't count towards the filters button active state
	const mobileFiltersCount = $derived(filters.count - (filters.value.townHall !== undefined ? 1 : 0));

	// Changing the search term resets pagination back to page 1, since the current page may no longer exist
	const search = mkParamStore('search', 'string', { resetKeys: [pageParam] });
	const setSearchDebounced = debounce((value: string | undefined) => {
		search.value = value;
	}, SET_SEARCH_DEBOUNCE_MS);

	const pageStore = mkPageStore(pageParam);
	const currentPage = $derived(pageStore.value);
	// Currently `ARMIES_PAGE_SIZE` is fixed since every server fetch call limits
	// by this, but if we wanted more flexibility this design could be reconsidered.
	const totalPages = $derived(Math.max(1, Math.ceil(total / ARMIES_PAGE_SIZE)));
	let previousPage = $state(currentPage);

	// True while a filter/search/pagination change is re-fetching this page's data from the server.
	const isLoading = $derived(navigating.to !== null && navigating.to.url.pathname === page.url.pathname);
	let showLoading = $state(false);

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

	$effect(() => {
		if (!isLoading) {
			showLoading = false;
			return;
		}
		const timer = setTimeout(() => {
			showLoading = true;
		}, LOADING_SPINNER_DELAY_MS);
		return () => {
			clearTimeout(timer);
		};
	});

	function resetPage() {
		pageStore.value = 1;
	}

	function resetFilters() {
		setSearchDebounced.cancel();
		search.value = undefined;
		filters.resetAllFilters();
	}
</script>

<div class="army-list">
	{#if bannerOptions}
		<Banner {...bannerOptions} style="margin-bottom: 10px" />
	{/if}

	<div class="list-row">
		{#if allowFilters}
			<div class="filters">
				<FiltersDrawer {filters} bind:open={filtersOpen} {...typeof allowFilters === 'object' ? allowFilters : {}} />
			</div>
		{/if}

		<div class="list">
			{#if allowSearch || allowFilters}
				<div class="controls">
					{#if allowSearch}
						<div class="search-box">
							<SearchBox value={search.value} onChange={(value) => setSearchDebounced(value ?? undefined)} />
						</div>
					{/if}
					{#if allowFilters && showTHFilter}
						<div class="th-filter-mobile">
							<THFilterButton value={filters.value.townHall} onChange={(value) => filters.setTownHall(value ?? undefined)} short />
						</div>
					{/if}
					{#if allowFilters}
						<button
							type="button"
							class="utility-btn regular filters-toggle-btn"
							class:active={mobileFiltersCount > 0}
							style="--bg-clr: var(--grey-800); --bg-clr-hover: var(--grey-850); --gap: 4px; --fs: 15px; --fs-weight: 500; --icon-height: 12px;"
							onclick={() => (filtersOpen = true)}
						>
							<svg width="14" height="12" viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path
									d="M5.14196 3.53486e-07C4.61006 -0.000278488 4.09117 0.164419 3.6568 0.471394C3.22243 0.77837 2.89397 1.21251 2.71667 1.71399H0V3.42797H2.71667C2.89372 3.92977 3.22207 4.36429 3.65645 4.67165C4.09082 4.979 4.60984 5.14406 5.14196 5.14406C5.67408 5.14406 6.19309 4.979 6.62747 4.67165C7.06184 4.36429 7.39019 3.92977 7.56725 3.42797H13.7119V1.71399H7.56725C7.38995 1.21251 7.06148 0.77837 6.62711 0.471394C6.19274 0.164419 5.67385 -0.000278488 5.14196 3.53486e-07ZM4.28496 2.57098C4.28496 2.34369 4.37525 2.12571 4.53597 1.96499C4.69669 1.80428 4.91467 1.71399 5.14196 1.71399C5.36925 1.71399 5.58723 1.80428 5.74794 1.96499C5.90866 2.12571 5.99895 2.34369 5.99895 2.57098C5.99895 2.79827 5.90866 3.01625 5.74794 3.17696C5.58723 3.33768 5.36925 3.42797 5.14196 3.42797C4.91467 3.42797 4.69669 3.33768 4.53597 3.17696C4.37525 3.01625 4.28496 2.79827 4.28496 2.57098ZM8.56993 6.85594C8.03803 6.85566 7.51915 7.02036 7.08478 7.32734C6.65041 7.63431 6.32194 8.06845 6.14464 8.56993H0V10.2839H6.14464C6.3217 10.7857 6.65004 11.2202 7.08442 11.5276C7.51879 11.8349 8.03781 12 8.56993 12C9.10205 12 9.62106 11.8349 10.0554 11.5276C10.4898 11.2202 10.8182 10.7857 10.9952 10.2839H13.7119V8.56993H10.9952C10.8179 8.06845 10.4895 7.63431 10.0551 7.32734C9.62071 7.02036 9.10182 6.85566 8.56993 6.85594ZM7.71294 9.42692C7.71294 9.19963 7.80323 8.98165 7.96394 8.82094C8.12466 8.66022 8.34264 8.56993 8.56993 8.56993C8.79722 8.56993 9.0152 8.66022 9.17591 8.82094C9.33663 8.98165 9.42692 9.19963 9.42692 9.42692C9.42692 9.65421 9.33663 9.87219 9.17591 10.0329C9.0152 10.1936 8.79722 10.2839 8.56993 10.2839C8.34264 10.2839 8.12466 10.1936 7.96394 10.0329C7.80323 9.87219 7.71294 9.65421 7.71294 9.42692Z"
									fill="currentColor"
								/>
							</svg>
							Filters
						</button>
					{/if}
				</div>
			{/if}

			<ul
				class="armies-list"
				bind:this={listRef}
				style={typeof paginationScrollTarget === 'number' ? `scroll-margin-top: ${paginationScrollTarget}px` : undefined}
			>
				{#if showLoading}
					<li class="loading-state" aria-hidden="true">
						<span class="spinner"></span>
					</li>
				{:else}
					{#each armies as model (model.id)}
						<ArmyCard {model} />
					{/each}
				{/if}
			</ul>

			{#if !armies.length && !showLoading}
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

			{#if !showLoading}
				<Pagination {totalPages} {pageParam} />
			{/if}
		</div>
	</div>
</div>

<style>
	.list-row {
		display: flex;
		align-items: flex-start;
		gap: 16px;
	}
	.filters {
		width: 324px;
		flex-shrink: 0;

		/*
		    Below this width, the drawer renders itself as an off-page
			panel instead, so the wrapper shouldn't reserve any row space.
		 */
		@media (max-width: 900px) {
			display: contents;
		}
	}

	.list {
		flex: 1 0 0px;
		min-width: 0;
	}

	.controls {
		display: flex;
		align-items: center;
		gap: 4px;
		--controls-height: 40px;

		/* The search box is always visible when present, regardless of breakpoint */
		&:has(.search-box) {
			margin-bottom: 10px;
		}

		/*
		    Below this width, other controls become visible even without a search box.
			Above it they're always `display: none`, so `:not(:empty)` alone doesn't work then.
		 */
		@media (max-width: 900px) {
			&:not(:empty) {
				margin-bottom: 10px;
			}
		}

		& .search-box {
			flex: 1 0 0px;
		}

		& .filters-toggle-btn {
			display: none;
			text-transform: none;
			color: var(--grey-400);
			height: var(--controls-height);

			&.active {
				color: hsl(33, 52%, 58%);
			}

			@media (max-width: 900px) {
				display: flex;
			}
		}

		/* On desktop the TH filter lives inside `FiltersDrawer` instead, which is always visible there */
		& .th-filter-mobile {
			display: none;

			@media (max-width: 900px) {
				display: block;
			}
		}
	}

	.armies-list {
		display: flex;
		flex-flow: column nowrap;
		gap: 10px;
	}

	.loading-state {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 3em 0;
	}

	.spinner {
		width: 24px;
		height: 24px;
		border: 4px solid var(--grey-500);
		border-bottom-color: transparent;
		border-radius: 50%;
		display: inline-block;
		box-sizing: border-box;
		animation: spin 1s linear infinite;
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
