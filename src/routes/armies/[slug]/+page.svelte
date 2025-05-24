<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/state';
	import { onMount, getContext, untrack } from 'svelte';
	import { PAGE_VIEW_METRIC } from '$shared/utils';
	import type { AppState } from '$types';
	import { ArmyModel } from '$models';
	import C from '$components';

	const { data }: { data: PageData } = $props();
	const { army } = $derived(data);

	const app = getContext<AppState>('app');
	const model = $derived.by(() => {
		void army;
		return untrack(() => new ArmyModel(app, army));
	});
	const stats = $derived(model.getStats());

	const metaDescription = $derived.by(getMetaDescription);
	const ogTitle = $derived(`${model.name}: A powerful Clash of Clans TH${model.townHall} ${stats.type} attack army`);
	const ogDescription = $derived(metaDescription);

	onMount(() => {
		app.http.post('/api/armies/metrics', { metric: PAGE_VIEW_METRIC, armyId: army.id }).catch(() => {});
	});

	// TODO: this function is not well implemented, but it's late and works well enough for now...
	function getMetaDescription() {
		let description = `${model.name}: A powerful Clash of Clans TH${model.townHall} ${stats.type} attack army. Learn this strategy with a full troop, spell`;
		if (stats.hasClanCastle) {
			description += ', clan castle';
		}
		if (stats.hasHeroes) {
			description += ' and hero';
		}
		description += ' composition';
		if (stats.hasGuide) {
			description += ', along with an in-depth guide';
		}
		description += '!';
		return description;
	}
</script>

<svelte:head>
	<meta name="description" content={metaDescription} />
	<meta property="og:title" content={ogTitle} />
	<meta property="og:description" content={ogDescription} />
	<link rel="canonical" href="https://clasharmies.com/armies/{page.params.slug}" />
</svelte:head>

<section class="army">
	<div class="container">
		<C.ViewArmy {army} />
	</div>
</section>

<style>
	.army {
		padding: 32px var(--side-padding);
		flex: 1 0 0px;
	}

	@media (max-width: 850px) {
		.army {
			padding: 32px var(--side-padding) 24px var(--side-padding);
		}
	}
</style>
