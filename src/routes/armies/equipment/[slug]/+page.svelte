<script lang="ts">
	import { page } from '$app/state';
	import { ARMY_PAGES } from '$client/pages';
	import ArmyList from '$components/Armies/ArmyList.svelte';
	import PaginatedCanonical from '$components/Armies/PaginatedCanonical.svelte';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
	const slug = $derived(page.params.slug!);
	const pageMeta = $derived(ARMY_PAGES.equipment(data.name));
</script>

<svelte:head>
	<title>ClashArmies • Best {data.name} armies - Clash of Clans</title>
	<meta name="description" content="Browse top performing {data.name} armies. Find the best Clash of Clans strategies featuring the {data.name} equipment." />
</svelte:head>

<PaginatedCanonical href="https://clasharmies.com/armies/equipment/{slug}" />

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
