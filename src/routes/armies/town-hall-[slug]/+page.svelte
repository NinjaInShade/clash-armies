<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/state';
	import { ARMY_PAGES } from '$client/pages';
	import ArmyList from '~/components/Armies/ArmyList.svelte';

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
	<link rel="canonical" href="https://clasharmies.com/armies/town-hall-{townHall}" />
</svelte:head>

<section class="armies">
	<div class="container">
		<ArmyList data={data.armies} bannerOptions={pageMeta.bannerOptions} allowSearch allowFilters />
	</div>
</section>

<style>
	.armies {
		padding: 16px var(--side-padding) 32px var(--side-padding);
	}
</style>
