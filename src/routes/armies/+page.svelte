<script lang="ts">
	import type { PageData } from './$types';
	import { getTags } from '~/lib/client/army';
	import THWidgetDisplay from '~/routes/admin/townhalls/THWidgetDisplay.svelte';
	import C from '~/components';

	const { data }: { data: PageData } = $props();
	const { armies, townHalls } = $derived(data);

	const thSelectData = $derived.by(() => {
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
	const sortSelectData = [
		{ value: null, label: 'Default (a-z)' },
		{ value: 'new', label: 'Newest' },
		{ value: 'votes', label: 'Votes' }
	];

	const ENTRIES_PER_PAGE = 25;
	let page = $state<number>(1);

	let search = $state<string | null>(null);
	let townHall = $state<number | null>(null);
	let attackType = $state<string | null>(null);
	let sortOrder = $state<'votes' | 'new' | null>(null);

	let displayArmies = $derived.by(() => {
		const filtered = armies.filter((a) => {
			const tags = getTags(a);
			if (townHall !== null && a.townHall !== townHall) {
				return false;
			}
			if (attackType !== null && !tags.includes(attackType)) {
				return false;
			}
			if (search && !a.name.toLowerCase().includes(search.toLowerCase())) {
				return false;
			}
			return true;
		});
		filtered.sort((a, b) => {
			if (sortOrder === 'new') {
				return +b.createdTime - +a.createdTime;
			}
			if (sortOrder === 'votes') {
				return b.votes - a.votes;
			}
			// Default sorting (a-z|A-Z )
			return a.name.localeCompare(b.name);
		});
		return filtered.slice(0, page * ENTRIES_PER_PAGE);
	});

	function resetFilters() {
		search = null;
		townHall = null;
		attackType = null;
	}

	function loadMore() {
		page += 1;
	}
</script>

<svelte:head>
	<title>ClashArmies • Find Armies</title>
</svelte:head>

<section class="armies">
	<div class="container">
		<div class="filters">
			<C.Fieldset label="Search" htmlName="search" --input-width="250px">
				<C.Input bind:value={search} placeholder="Electro zap..." />
			</C.Fieldset>
			<div class="right">
				<C.Fieldset label="Town Hall" htmlName="townhall" --input-width="100px">
					<C.Select bind:value={townHall} data={thSelectData} />
				</C.Fieldset>
				<C.Fieldset label="Attack Type" htmlName="type" --input-width="130px">
					<C.Select bind:value={attackType} data={attackTypeSelectData} />
				</C.Fieldset>
				<C.Fieldset label="Sort by" htmlName="sort" --input-width="175px">
					<C.Select bind:value={sortOrder} data={sortSelectData} />
				</C.Fieldset>
			</div>
		</div>
		<ul class="armies-grid">
			{#each displayArmies as army (army.id)}
				<C.ArmyCard {army} />
			{/each}
		</ul>
		{#if displayArmies.length && displayArmies.length < armies.length}
			<C.Button onclick={loadMore} style="display: block; margin: 24px auto 0 auto;">Load more...</C.Button>
		{/if}

		{#if !displayArmies.length}
			<div class="no-data">
				<img src="/clash/ui/pekka.png" alt="PEKKA" />
				<h2>There are no armies matching this criteria warrior!</h2>
				<C.Button onclick={resetFilters}>Reset filters</C.Button>
			</div>
		{/if}
	</div>
</section>

<style>
	.armies {
		padding: 50px var(--side-padding);
		flex: 1 0 0px;
	}

	.armies .container {
		display: flex;
		flex-flow: column nowrap;
		height: 100%;
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

	@media (max-width: 600px) {
		.filters {
			flex-flow: column nowrap;
			align-items: flex-start;
		}
	}

	@media (max-width: 550px) {
		.no-data img {
			max-width: 100%;
		}
	}

	@media (max-width: 425px) {
		.armies {
			padding-top: 32px;
		}

		.right {
			flex-flow: column nowrap;
			width: 100%;
		}

		:global(.filters fieldset) {
			--input-width: 100%;
			width: 100%;
		}
	}
</style>
