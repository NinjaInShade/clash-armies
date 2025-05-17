<script lang="ts">
	import C from '$components';
	import { getContext, untrack } from 'svelte';
	import type { PageData } from './$types';
	import type { AppState } from '$types';
	import { ArmyModel } from '$models';

	const { data }: { data: PageData } = $props();
	const app = getContext<AppState>('app');
	const armies = $derived(
		data.armies.map((army) => {
			return untrack(() => new ArmyModel(app, army));
		})
	);

	const ENTRIES_PER_PAGE = 10;

	let page = $state<number>(1);

	const displayArmies = $derived.by(() => {
		return armies.slice(0, page * ENTRIES_PER_PAGE);
	});

	function loadMore() {
		page += 1;
	}
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
			<C.Button asLink href="/armies">Find armies</C.Button>
			<C.Button asLink href="/create">Create army</C.Button>
		</div>

		<img class="graphic" src="/clash/ui/header-barbarian.png" alt="Angry clash of clans barbarian" />
		<img class="graphic-mobile" src="/clash/ui/league-king-1.png" alt="Clash of clans barbarian king with league skin" />
	</div>
</header>

<section class="top-armies">
	<div class="container">
		<h2>
			<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path
					d="M3.55556 16V14.2222H7.11111V11.4667C6.38519 11.3037 5.73689 10.9961 5.16622 10.544C4.59556 10.0919 4.17719 9.52533 3.91111 8.84444C2.8 8.71111 1.87022 8.22607 1.12178 7.38933C0.373334 6.55259 -0.000591889 5.57096 7.03235e-07 4.44444V1.77778H3.55556V0H12.4444V1.77778H16V4.44444C16 5.57037 15.6258 6.552 14.8773 7.38933C14.1289 8.22667 13.1994 8.7117 12.0889 8.84444C11.8222 9.52593 11.4036 10.0927 10.8329 10.5449C10.2622 10.997 9.61422 11.3043 8.88889 11.4667V14.2222H12.4444V16H3.55556ZM3.55556 6.93333V3.55556H1.77778V4.44444C1.77778 5.00741 1.94074 5.51496 2.26667 5.96711C2.59259 6.41926 3.02222 6.74133 3.55556 6.93333ZM12.4444 6.93333C12.9778 6.74074 13.4074 6.41837 13.7333 5.96622C14.0593 5.51407 14.2222 5.00681 14.2222 4.44444V3.55556H12.4444V6.93333Z"
					fill="var(--grey-300)"
				/>
			</svg>
			Top armies
		</h2>
		<ul class="armies-list">
			{#each displayArmies as model (model.id)}
				<C.ArmyCard {model} />
			{/each}
		</ul>
		{#if displayArmies.length && displayArmies.length < armies.length}
			<C.Button onClick={loadMore} style="display: block; margin: 24px auto 0 auto;">Load more...</C.Button>
		{/if}
	</div>
</section>

<style>
	header {
		background: repeat-x 0 25% url('/clash/ui/stones-background.png');
		padding: 0 var(--side-padding);
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
		padding: 0 var(--side-padding) 50px var(--side-padding);
	}

	.top-armies h2 {
		display: flex;
		align-items: center;
		font-size: var(--fs);
		line-height: var(--fs);
		font-weight: 400;
		font-family: 'Poppins', sans-serif;
		text-transform: uppercase;
		letter-spacing: 2px;
		color: var(--grey-300);
		margin-bottom: 20px;
		gap: 12px;
	}

	.armies-list {
		display: flex;
		flex-flow: column nowrap;
		gap: 1em;
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
			background: repeat-x 0 8.5% url('/clash/ui/stones-background.png');
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
			padding: 75px 0 0 0;
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
