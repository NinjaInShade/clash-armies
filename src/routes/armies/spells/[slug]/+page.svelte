<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/state';
	import { ARMY_PAGES } from '$client/pages';
	import ArmyList from '~/components/Armies/ArmyList.svelte';
	import { decodeUnitName } from '$shared/utils';

	const { data }: { data: PageData } = $props();
	const spell = $derived(page.params.slug!);
	const spellDecoded = $derived(decodeUnitName(spell));
	const pageMeta = $derived(ARMY_PAGES.spell(spellDecoded));
</script>

<svelte:head>
	<title>ClashArmies • Best {spellDecoded} spell armies - Clash of Clans</title>
	<meta name="description" content="Browse top performing {spell} spell armies. Find the best Clash of Clans strategies with the {spell} spell." />
	<link rel="canonical" href="https://clasharmies.com/armies/spells/{spell}" />
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
