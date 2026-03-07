<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/state';
	import { ARMY_PAGES } from '$client/pages';
	import ArmyList from '~/components/Armies/ArmyList.svelte';
	import { decodeUnitName } from '$shared/utils';

	const { data }: { data: PageData } = $props();
	const troop = $derived(page.params.slug!);
	const troopDecoded = $derived(decodeUnitName(troop));
	const pageMeta = $derived(ARMY_PAGES.troop(troopDecoded));
</script>

<svelte:head>
	<title>ClashArmies • Best {troopDecoded} armies - Clash of Clans</title>
	<meta name="description" content="Browse top performing {troop} armies. Find the best Clash of Clans strategies featuring the {troop} troop." />
	<link rel="canonical" href="https://clasharmies.com/armies/troops/{troop}" />
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
