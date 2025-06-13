<script lang="ts">
	import type { PageData } from './$types';
	import { ARMY_PAGES } from '$client/pages';
	import ArmyList from '~/components/Armies/ArmyList.svelte';

	const { data }: { data: PageData } = $props();
	const pageMeta = ARMY_PAGES.latest;
</script>

<svelte:head>
	<title>ClashArmies • Latest Clash of Clans Armies - Fresh attack strategies</title>
	<meta name="description" content="Explore the newest Clash of Clans armies - stay ahead and up-to-date with creative and in-meta armies" />
	<link rel="canonical" href="https://clasharmies.com/latest" />
</svelte:head>

<section class="armies">
	<div class="container">
		<ArmyList data={data.armies} bannerOptions={pageMeta.bannerOptions} allowSearch allowTHFilter />
	</div>
</section>

<style>
	.armies {
		padding: 16px var(--side-padding) 32px var(--side-padding);
	}
</style>
