<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/state';
	import { ARMY_PAGES } from '$client/pages';
	import ArmyList from '~/components/Armies/ArmyList.svelte';
	import { decodeUnitName } from '$shared/utils';

	const { data }: { data: PageData } = $props();
	const pet = $derived(page.params.slug!);
	const petDecoded = $derived(decodeUnitName(pet));
	const pageMeta = $derived(ARMY_PAGES.pet(petDecoded));
</script>

<svelte:head>
	<title>ClashArmies • Best {petDecoded} armies - Clash of Clans</title>
	<meta name="description" content="Browse top performing {pet} armies. Find the best Clash of Clans strategies featured the {pet} pet." />
	<link rel="canonical" href="https://clasharmies.com/armies/pets/{pet}" />
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
