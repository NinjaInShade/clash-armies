<script lang="ts">
	import C from '$components';
	import type { PageData } from './$types';
	import { ARMY_PAGES } from '$client/pages';
	import ArmyList from '~/components/Armies/ArmyList.svelte';

	const { data }: { data: PageData } = $props();
	const newArmiesMeta = ARMY_PAGES.latest;
</script>

<svelte:head>
	<title>ClashArmies • Best Clash of Clans Armies & Strategies</title>
	<meta
		name="description"
		content="Discover the best Clash of Clans armies - ranked, curated, and constantly updated. Explore top picks for CWL, trending, in-meta strategies, rising comps, and more to dominate every attack."
	/>
	<link rel="canonical" href="https://clasharmies.com" />
</svelte:head>

<header>
	<div class="container">
		<h1>Find the best<br /> armies <span>EVER!</span></h1>
		<p class="body">The number one tool to find, create, learn and share the best armies in Clash of Clans</p>
		<div class="buttons">
			<C.Button asLink href="/armies">Find army</C.Button>
			<C.Button asLink href="/army-builder">Create army</C.Button>
		</div>

		<img class="graphic" src="/clash/ui/header-barbarian.png" alt="Angry clash of clans barbarian" />
		<img class="graphic-mobile" src="/clash/ui/league-king-1.png" alt="Clash of clans barbarian king with league skin" />
	</div>
</header>

<section class="top-armies">
	<div class="container">
		<ArmyList
			data={data.armies}
			bannerOptions={{
				...newArmiesMeta.bannerOptions,
				img: newArmiesMeta.img,
				imgAlt: newArmiesMeta.imgAlt,
			}}
		/>
	</div>
</section>

<style>
	header {
		background: repeat-x 0 25% url('/clash/ui/stones-background.png');
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
	.graphic-mobile {
		display: none;
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
			background: repeat-x 0 15% url('/clash/ui/stones-background.png');
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
			background: repeat-x 0 7% url('/clash/ui/stones-background.png');
		}

		.graphic {
			display: none;
		}

		.graphic-mobile {
			margin: 24px 0;
			max-width: 100%;
			height: auto;
			display: block;
			position: relative;
			max-width: 140%;
			margin-bottom: -40px;
			right: 30%;
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
