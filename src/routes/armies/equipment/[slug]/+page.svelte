<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/state';
	import { ARMY_PAGES } from '$client/pages';
	import ArmyList from '~/components/Armies/ArmyList.svelte';
	import { decodeUnitName } from '$shared/utils';

	const { data }: { data: PageData } = $props();
	const equipment = $derived(page.params.slug!);
	const equipmentDecoded = $derived(decodeUnitName(equipment));
	const pageMeta = $derived(ARMY_PAGES.equipment(equipmentDecoded));
</script>

<svelte:head>
	<title>ClashArmies • Best {equipmentDecoded} armies - Clash of Clans</title>
	<meta name="description" content="Browse top performing {equipment} armies. Find the best Clash of Clans strategies featuring the {equipment} equipment." />
	<link rel="canonical" href="https://clasharmies.com/armies/equipment/{equipment}" />
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
