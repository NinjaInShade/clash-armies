<script lang="ts">
	import type { PageData } from './$types';
	import { ARMY_PAGES } from '$client/pages';
	import ArmyList from '~/components/Armies/ArmyList.svelte';

	const { data }: { data: PageData } = $props();
	const pageMeta = ARMY_PAGES.all;
</script>

<svelte:head>
	<title>ClashArmies • Find Clash of Clans armies by troops, TH Level & Strategy!</title>
	<meta
		name="description"
		content="Browse hundreds of user-created Clash of Clans armies. Filter by town hall, strategy, troop types, and more to find the perfect attack for any war or farming goal."
	/>
	<link rel="canonical" href="https://clasharmies.com/armies" />
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
