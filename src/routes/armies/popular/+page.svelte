<script lang="ts">
	import { ARMY_PAGES } from '$client/pages';
	import ArmyList from '$components/Armies/ArmyList.svelte';
	import PaginatedCanonical from '$components/Armies/PaginatedCanonical.svelte';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
	const pageMeta = ARMY_PAGES.popular;
</script>

<svelte:head>
	<title>ClashArmies • Top Rated Clash of Clans Armies - Most popular strategies</title>
	<meta
		name="description"
		content="Browse the most popular Clash of Clans armies. Find what's working best across all Town Hall levels, for war, farming, and more!"
	/>
</svelte:head>

<PaginatedCanonical href="https://clasharmies.com/armies/popular" />

<section class="armies">
	<div class="container">
		<ArmyList data={data.armies} total={data.total} bannerOptions={pageMeta.bannerOptions} allowSearch allowFilters />
	</div>
</section>

<style>
	.armies {
		padding: 16px var(--side-padding) 32px var(--side-padding);
	}
</style>
