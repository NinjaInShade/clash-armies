<script lang="ts">
	import ImgHeaderBarbLarge from '$assets/ui/header-barbarian_large.webp';
	import ImgLeagueKing from '$assets/ui/league-king.webp';
	import ImgLeagueKingLarge from '$assets/ui/league-king_large.webp';
	import { ARMY_PAGES } from '$client/pages';
	import ArmyList from '$components/Armies/ArmyList.svelte';
	import PaginatedCanonical from '$components/Armies/PaginatedCanonical.svelte';
	import Button from '$components/Button.svelte';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
	const latestArmiesMeta = ARMY_PAGES.latest;
</script>

<svelte:head>
	<title>ClashArmies • Best Clash of Clans Armies & Strategies</title>
	<meta
		name="description"
		content="Discover the best Clash of Clans armies - ranked, curated, and constantly updated. Explore top picks for CWL, trending, in-meta strategies, rising comps, and more to dominate every attack."
	/>
</svelte:head>

<PaginatedCanonical href="https://clasharmies.com" />

<header>
	<div class="container">
		<h1>Find the best<br /> armies <span>EVER!</span></h1>
		<p class="body">The number one tool to find, create, learn and share the best armies in Clash of Clans</p>
		<div class="buttons">
			<Button asLink href="/armies/popular">Find army</Button>
			<Button asLink href="/army-builder">Create army</Button>
		</div>

		<picture>
			<source srcset={ImgLeagueKing} media="(max-width: 400px)" />
			<source srcset={ImgLeagueKingLarge} media="(max-width: 625px)" />
			<img class="graphic" src={ImgHeaderBarbLarge} alt="Clash of Clans unit" width="803" height="578" fetchpriority="high" />
		</picture>
	</div>
</header>

<section class="top-armies">
	<div class="container">
		<ArmyList data={data.armies} total={data.total} bannerOptions={latestArmiesMeta.bannerOptions} allowSearch allowFilters paginationScrollTarget={275} />
	</div>
</section>

<style>
	header {
		background: repeat-x 0 25% url('$assets/ui/stones-background.webp');
		padding: 0 var(--side-padding);
		overflow: hidden;
	}

	header .container {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: center;
		position: relative;
		padding: 150px 0 200px 0;
	}

	header .body {
		margin: 16px 0 32px 0;
		max-width: 365px;
	}
	header .buttons {
		display: flex;
		gap: 0.5em;
	}

	.graphic {
		position: absolute;
		right: -215px;
		bottom: 0;
	}

	h1 span {
		font-size: var(--h1);
		line-height: var(--h1-lh);
	}

	.top-armies {
		padding: 0 var(--side-padding) 32px var(--side-padding);
		margin-top: 10px;
	}

	@media (max-width: 1000px) {
		header {
			background: repeat-x 0 15% url('$assets/ui/stones-background.webp');
		}

		header .container {
			padding: 100px 0 175px 0;
		}

		.graphic {
			max-width: 700px;
			height: auto;
		}
	}

	@media (max-width: 825px) {
		.graphic {
			max-width: 550px;
		}
	}

	@media (max-width: 625px) {
		header {
			background: repeat-x 0 7% url('$assets/ui/stones-background.webp');
		}

		.graphic {
			margin: 24px 0;
			max-width: 100%;
			height: auto;
			display: block;
			position: relative;
			max-width: 140%;
			margin-bottom: -40px;
			right: 30%;
			/** At this breakpoint a different image for mobile is rendered, with different width/height (see <source>) */
			aspect-ratio: 700 / 614;
		}

		header .container {
			padding: 60px 0 0 0;
		}
	}

	@media (max-width: 375px) {
		header br {
			display: none;
		}
		header .buttons {
			flex-flow: column nowrap;
		}
	}
</style>
