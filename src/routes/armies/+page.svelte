<script lang="ts">
	import type { PageData } from './$types';
	import { getTags } from '~/lib/client/army';
	import THWidgetDisplay from '../admin/THWidgetDisplay.svelte';
	import C from '~/components';

	const { data } = $props<{ data: PageData }>();
	const { armies, townHalls } = $derived(data);

	const thSelectData = $derived.call(() => {
		const data = [];
		data.push({ value: null, label: 'All' });
		data.push(
			...townHalls.map((x) => {
				return { value: x.level, component: [THWidgetDisplay, { level: x.level, displayLevel: true, height: 24 }] };
			})
		);
		return data;
	});
	const attackTypeSelectData = [
		{ value: null, label: 'All' },
		{ value: 'Ground', label: 'Ground' },
		{ value: 'Air', label: 'Air' }
	];

	let search = $state<string | null>(null);
	let townHall = $state<number | null>(null);
	let attackType = $state<string | null>(null);

	let filteredArmies = $derived.call(() => {
		return armies.filter((a) => {
			const tags = getTags(a);
			if (townHall !== null && a.townHall !== townHall) {
				return false;
			}
			if (attackType !== null && !tags.includes(attackType)) {
				return false;
			}
			if (search && !a.name.includes(search)) {
				return false;
			}
			return true;
		});
	});

	function resetFilters() {
		search = null;
		townHall = null;
		attackType = null;
	}
</script>

<svelte:head>
	<title>ClashArmies • Find Armies</title>
</svelte:head>

<section class="armies">
	<div class="container">
		<div class="filters">
			<C.Fieldset label="Search" htmlName="search">
				<C.Input bind:value={search} placeholder="Electro zap..." />
			</C.Fieldset>
			<div class="right">
				<C.Fieldset label="Town Hall" htmlName="townhall" style="max-width: 150px; width: 100%;">
					<C.Select bind:value={townHall} data={thSelectData} />
				</C.Fieldset>
				<C.Fieldset label="Attack Type" htmlName="type" style="max-width: 150px; width: 100%;">
					<C.Select bind:value={attackType} data={attackTypeSelectData} />
				</C.Fieldset>
			</div>
		</div>
		<ul class="armies-grid">
			{#each filteredArmies as army}
				<C.ArmyCard {army} />
			{/each}
		</ul>

		{#if !filteredArmies.length}
			<div class="no-data">
				<img src="/clash/ui/pekka.png" alt="PEKKA" />
				<h2>There are no armies matching this criteria warrior!</h2>
				<C.Button onclick={resetFilters}>Reset filters</C.Button>
			</div>
		{/if}
	</div>
</section>

<style>
	header {
		padding: 50px var(--side-padding);
	}

	.armies {
		padding: 50px var(--side-padding);
		flex: 1 0 0px;
	}

	.armies .container {
		display: flex;
		flex-flow: column nowrap;
		height: 100%;
	}

	.title {
		font-size: 3em;
	}

	.filters {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		margin-bottom: 1em;
		gap: 0.5em;
	}

	.filters .right {
		display: flex;
		justify-content: flex-end;
		align-items: flex-end;
		flex: 1 0 0px;
		gap: 0.5em;
	}

	.armies-grid {
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: auto;
		gap: 0.5em;
	}

	.no-data {
		display: flex;
		justify-content: center;
		align-items: center;
		flex-flow: column nowrap;
		background-color: var(--grey-800);
		border-radius: 8px;
		padding: 2em 0;
		flex: 1 0 0px;
	}

	.no-data h2 {
		max-width: 675px;
		text-align: center;
		font-size: var(--h2);
		line-height: var(--h2-lh);
		font-weight: 400;
		margin: 1em 0 0.75em 0;
	}

	.no-data img {
		max-width: 550px;
		width: 100%;
	}
</style>
