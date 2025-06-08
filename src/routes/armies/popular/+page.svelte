<script lang="ts">
	import type { PageData } from './$types';
	import { ARMY_PAGES } from '$client/pages';
	import ArmyList from '~/components/Armies/ArmyList.svelte';

	const { data }: { data: PageData } = $props();
	const pageMeta = ARMY_PAGES.popular;
</script>

<svelte:head>
	<title>ClashArmies • Top Rated Clash of Clans Armies - Most popular strategies</title>
	<meta
		name="description"
		content="Browse the most popular Clash of Clans armies. Find what's working best across all Town Hall levels, for war, farming, and more!"
	/>
	<link rel="canonical" href="https://clasharmies.com/popular" />
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
			allowTHFilter
			allowFilters
		/>
	</div>
</section>

<style>
	.armies {
		padding: 16px var(--side-padding) 32px var(--side-padding);
	}
</style>
