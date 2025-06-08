<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/state';
	import { ARMY_PAGES } from '$client/pages';
	import ArmyList from '~/components/Armies/ArmyList.svelte';

	const { data }: { data: PageData } = $props();
	const townHall = $derived(+page.params.slug);
	const pageMeta = $derived(ARMY_PAGES.townHall(townHall));
</script>

<svelte:head>
	<title>ClashArmies • Best Clash of Clans TH{townHall} Armies - Best Town Hall {townHall} strategies</title>
	<meta
		name="description"
		content="Browse top performing Town Hall {townHall} armies. Perfect your TH{townHall} attacks for war, farming, and CWL with tested strategies."
	/>
	<link rel="canonical" href="https://clasharmies.com/town-hall-{townHall}" />
</svelte:head>

<section class="armies">
	<div class="container">
		<ArmyList
			data={data.armies}
			bannerOptions={{
				...pageMeta.bannerOptions,
				img: pageMeta.img,
				imgAlt: pageMeta.imgAlt,
			}}
			allowSearch
			allowFilters
		/>
	</div>
</section>

<style>
	.armies {
		padding: 16px var(--side-padding) 32px var(--side-padding);
	}
</style>
