<script lang="ts">
	import { onMount } from 'svelte';
	import type { Banner } from '$types';
	import { BANNERS } from '$shared/utils';
	import C from '$components';

	type Props = {
		/** The currently selected banner */
		banner: Banner;
		/** On save callback to call with newly selected baner */
		onSave: (newBanner: Banner) => void;
		/** Function that closes the modal */
		close: () => void;
	};
	let { close, banner, onSave }: Props = $props();

	let grid = $state<Element | null>(null);

	onMount(() => {
		// Need to wait until content is fully loaded before calling `scrollTo` otherwise it doesn't work
		// TODO: find a better way of solving this problem, this is a hack
		setTimeout(() => {
			if (!grid) {
				return;
			}
			// Look for the img with src ending in {banner}.webp, use button position for `scrollTo()`
			const selected = grid.querySelector(`img[src$="${banner}.webp"]`)?.parentElement;
			// The modals content container is the scroll container we need to call `scrollTo()` on
			const modalContent = grid.parentElement;
			if (selected && modalContent) {
				const SCROLL_PADDING = 16;
				const offset = modalContent.getBoundingClientRect().top;
				const top = selected.getBoundingClientRect().top;
				modalContent.scrollTo({ left: 0, top: top - offset - SCROLL_PADDING, behavior: 'smooth' });
			}
		}, 10);
	});

	function selectBanner(banner: Banner) {
		onSave(banner);
		close();
	}
</script>

<C.Modal title="Select banner" {close} --modal-width="1250px">
	<div class="banner-grid" bind:this={grid}>
		{#each BANNERS as bannerName}
			<button onclick={() => selectBanner(bannerName)} class:selected={bannerName === banner}>
				<img src="/clash/banners/{bannerName}.webp" alt="Clash of clans banner artwork" />
			</button>
		{/each}
	</div>
</C.Modal>

<style>
	.banner-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
		grid-template-rows: auto;
		gap: 0.5em;
	}

	button:focus,
	button:hover,
	button.selected {
		border-color: var(--primary-400);
		/* filter: grayscale(0); */
	}

	button {
		padding: 0.5em;
		transition: all 0.1s ease-in-out;
		border: 1.5px dashed var(--grey-500);
		border-radius: 8px;
		background: none;
		outline: none;
		/* filter: grayscale(1); */
	}

	img {
		display: block;
		aspect-ratio: 1920 / 800;
		border-radius: 4px;
		max-width: 100%;
	}

	@media (max-width: 550px) {
		.banner-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
