<script lang="ts">
	import { page as pageState } from '$app/state';
	import { mkPageStore, currentSearchParams } from '$client/params.svelte';
	import ActionButton from '$components/ActionButton.svelte';

	type Props = {
		totalPages: number;
		/**
		 * The URL search param key used to track the current page number.
		 * @default 'page'
		 */
		pageParam?: string;
	};
	const { totalPages, pageParam = 'page' }: Props = $props();

	const pageStore = mkPageStore(pageParam);
	const page = $derived(pageStore.value);
	const searchParams = $derived(currentSearchParams());

	/**
	 * Page numbers to render.
	 * Null values represent an ellipsis gap.
	 */
	const pages = $derived.by(() => {
		const delta = 1;
		const result: (number | null)[] = [];
		for (let p = 1; p <= totalPages; p++) {
			if (p === 1 || p === totalPages || (p >= page - delta && p <= page + delta)) {
				result.push(p);
			} else if (result.at(-1) !== null) {
				result.push(null);
			}
		}
		return result;
	});

	/**
	 * Returns true if `p` is immediately adjacent to `page` (e.g. page - 1 or page + 1).
	 * False will be returned if `p` is 1 or the last page.
	 * Used for hiding neighbours on mobile.
	 */
	function isAdjacent(p: number): boolean {
		return p !== 1 && p !== totalPages && (p === page - 1 || p === page + 1);
	}

	/**
	 * Builds a crawlable URL for a given page so search engines can properly
	 * discover and index results, preserving any other active query parameters.
	 */
	function hrefForPage(p: number) {
		const params = new URLSearchParams(searchParams);
		if (p === 1) {
			params.delete(pageParam);
		} else {
			params.set(pageParam, String(p));
		}
		const search = params.toString();
		return search ? `?${search}` : pageState.url.pathname;
	}
</script>

{#if totalPages > 1}
	<nav class="pagination" aria-label="Pagination">
		{#if page <= 1}
			<ActionButton theme="grey" disabled aria-label="Previous page">
				{@render chevron('prev')}
			</ActionButton>
		{:else}
			<ActionButton asLink href={hrefForPage(page - 1)} theme="grey" aria-label="Previous page" data-sveltekit-noscroll data-sveltekit-keepfocus>
				{@render chevron('prev')}
			</ActionButton>
		{/if}

		<div class="page-numbers">
			{#each pages as p, i (i)}
				{#if p === null}
					<span class="ellipsis" aria-hidden="true">
						<span></span>
						<span></span>
						<span></span>
					</span>
				{:else}
					<ActionButton
						asLink
						href={hrefForPage(p)}
						theme={p === page ? 'primary-dark' : 'grey'}
						class={p === page ? 'focus-primary page-active' : isAdjacent(p) ? 'focus-grey page-adjacent' : 'focus-grey'}
						aria-current={p === page ? 'page' : undefined}
						data-sveltekit-noscroll
						data-sveltekit-keepfocus
					>
						{p}
					</ActionButton>
				{/if}
			{/each}
		</div>

		<span class="page-info">Page {page} of {totalPages}</span>

		{#if page >= totalPages}
			<ActionButton theme="grey" disabled aria-label="Next page">
				{@render chevron('next')}
			</ActionButton>
		{:else}
			<ActionButton asLink href={hrefForPage(page + 1)} theme="grey" aria-label="Next page" data-sveltekit-noscroll data-sveltekit-keepfocus>
				{@render chevron('next')}
			</ActionButton>
		{/if}
	</nav>
{/if}

{#snippet chevron(type: 'prev' | 'next')}
	<svg class="chevron {type}" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path d="M1 1.5L6 6.5L11 1.5" stroke="#949494" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
	</svg>
{/snippet}

<style>
	.pagination {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-flow: row wrap;
		margin-top: 20px;
		gap: 8px;

		& :global(.action-btn) {
			display: flex;
			justify-content: center;
			font-size: 15px;
			line-height: 15px;
			font-weight: 600;
			letter-spacing: unset;
			min-width: 38px;
			height: 38px;
			border-radius: 6px;
			border: 1px dashed transparent;
		}

		& :global(.action-btn.grey:hover:not(:disabled)) {
			background-color: var(--grey-800);
		}

		& :global(.action-btn.primary-dark) {
			box-shadow: 0 0 0 1px hsl(33, 40%, 40%) inset;
		}

		& .page-numbers {
			display: flex;
			align-items: center;
			gap: 8px;
		}

		& .page-info {
			display: none;
			font-size: 14px;
			font-weight: 500;
			color: var(--grey-300);
			white-space: nowrap;
			padding: 0 4px;
		}

		& .ellipsis {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 22px;
			gap: 3px;

			& span {
				width: 4px;
				height: 4px;
				border-radius: 50%;
				background-color: var(--grey-500);
			}
		}

		& .chevron {
			height: 10px;
			width: auto;

			&.prev {
				transform: rotate(90deg);
			}

			&.next {
				transform: rotate(-90deg);
			}
		}

		@media (max-width: 500px) {
			& .page-numbers :global(.action-btn.page-adjacent) {
				display: none;
			}

			& .ellipsis {
				display: none;
			}
		}

		@media (max-width: 400px) {
			margin-top: 14px;
			gap: 6px;

			& :global(.action-btn) {
				font-size: 13px;
				line-height: 13px;
				min-width: 32px;
				height: 32px;
				border-radius: 6px;
			}

			& .chevron {
				height: 8px;
			}
		}

		@media (max-width: 300px) {
			& .page-numbers {
				display: none;
			}

			& .page-info {
				display: block;
			}
		}
	}
</style>
