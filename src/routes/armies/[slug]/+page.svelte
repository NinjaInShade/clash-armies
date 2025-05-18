<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/state';
	import { getContext, untrack } from 'svelte';
	import type { AppState } from '$types';
	import { getTags } from '$client/army';
	import { VALID_HEROES } from '$shared/utils';
	import { ArmyModel } from '$models';
	import C from '$components';

	const { data }: { data: PageData } = $props();
	const { army } = $derived(data);

	const app = getContext<AppState>('app');
	const model = $derived.by(() => {
		void army;
		return untrack(() => new ArmyModel(app, army));
	});

	// TODO: add a getArmyMeta() method or similar on model for a general computed list of attributes
	const tags = $derived(getTags(model));
	const armyType = $derived.by(() => {
		if (tags.find((tag) => tag.label === 'Ground')) {
			return 'Ground';
		} else {
			return 'Air';
		}
	});

	const metaDescription = $derived.by(getMetaDescription);
	const ogTitle = $derived(`${model.name}: A powerful Clash of Clans TH${model.townHall} ${armyType.toLowerCase()} attack army`);
	const ogDescription = $derived(metaDescription);

	// TODO: this function is not well implemented, but it's late and works well enough for now...
	function getMetaDescription() {
		let description = `${model.name}: A powerful Clash of Clans TH${model.townHall} ${armyType.toLowerCase()} attack army. Learn this strategy with a full troop, spell`;
		if (model.ccUnits.length) {
			description += ', clan castle';
		}
		if (VALID_HEROES.some((hero) => model.hasHero(hero))) {
			description += ' and hero';
		}
		description += ' composition';
		if (model.guide) {
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
