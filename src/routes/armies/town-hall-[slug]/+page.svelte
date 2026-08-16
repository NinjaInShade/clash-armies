<script lang="ts">
	import { page } from '$app/state';
	import { ARMY_PAGES } from '$client/pages';
	import ArmyList from '$components/Armies/ArmyList.svelte';
	import PaginatedCanonical from '$components/Armies/PaginatedCanonical.svelte';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
	const townHall = $derived(+page.params.slug!);
	const pageMeta = $derived(ARMY_PAGES.townHall(townHall));
</script>

<svelte:head>
	<title>ClashArmies • Best town hall {townHall} armies - Clash of Clans</title>
	<meta
		name="description"
		content="Browse top performing Town Hall {townHall} armies. Perfect your TH{townHall} attacks for war, farming, and CWL with tested strategies."
	/>
</svelte:head>

<PaginatedCanonical href="https://clasharmies.com/armies/town-hall-{townHall}" />

<section class="armies">
	<div class="container">
		<ArmyList data={data.armies} total={data.total} bannerOptions={pageMeta.bannerOptions} allowSearch allowFilters={{ showTHFilter: false }} />
	</div>
</section>

<style>
	.armies {
		padding: 16px var(--side-padding) 32px var(--side-padding);
	}
</style>
