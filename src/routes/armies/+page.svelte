<script lang="ts">
	import { ARMY_PAGES } from '$client/pages';
	import ArmyList from '$components/Armies/ArmyList.svelte';
	import PaginatedCanonical from '$components/Armies/PaginatedCanonical.svelte';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
	const pageMeta = ARMY_PAGES.latest;
</script>

<svelte:head>
	<title>ClashArmies • Find Clash of Clans armies by troops, TH Level & Strategy!</title>
	<meta
		name="description"
		content="Browse hundreds of user-created Clash of Clans armies. Filter by town hall, strategy, troop types, and more to find the perfect attack for any war or farming goal."
	/>
</svelte:head>

<PaginatedCanonical href="https://clasharmies.com/armies" />

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
