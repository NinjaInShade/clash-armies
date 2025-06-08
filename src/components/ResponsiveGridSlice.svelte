<script lang="ts">
	import { untrack, onDestroy } from 'svelte';

	type Props = {
		items: unknown[];
		visibleItems: unknown[];
		gridContainer: HTMLElement | undefined;
		maxRows: number;
		colGap: number;
		thWidth: number;
	};
	let { items, visibleItems = $bindable(), gridContainer, maxRows, colGap, thWidth }: Props = $props();

	let observer = $state<ResizeObserver | undefined>(undefined);

	$effect(() => {
		untrack(disposeObserver);

		if (gridContainer) {
			untrack(makeObserver);
		}
	});

	onDestroy(() => {
		disposeObserver();
	});

	function disposeObserver() {
		if (observer) {
			observer.disconnect();
		}
	}

	function makeObserver() {
		if (!gridContainer) {
			throw new Error('Expected container');
		}
		observer = new ResizeObserver((entries) => {
			const width = entries[0].contentRect.width;
			const columns = Math.floor((width + colGap) / (thWidth + colGap));
			const maxItems = columns * maxRows;
			visibleItems = items.slice(0, maxItems);
		});
		observer.observe(gridContainer);
	}
</script>
