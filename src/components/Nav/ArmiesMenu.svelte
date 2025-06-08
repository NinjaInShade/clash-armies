<script lang="ts">
	import { getContext } from 'svelte';
	import type { AppState } from '$types';
	import Menu from '../Menu.svelte';
	import LinkCard from './LinkCard.svelte';
	import ResponsiveGridSlice from '../ResponsiveGridSlice.svelte';
	import { ARMY_PAGES } from '$client/pages';
	import type { TownHall } from '$types';
	import { fade } from 'svelte/transition';

	type Props = {
		open: boolean;
		elRef: HTMLElement | undefined;
	};
	let { open = $bindable(), elRef }: Props = $props();

	const app = getContext<AppState>('app');
	const townHalls = $derived(app.townHalls.toReversed());

	const TH_WIDTH = 140;
	const TH_ROWS_MAX = 2;
	const TH_COL_GAP = 24;
	const ARMY_LINKS = [ARMY_PAGES.popular, ARMY_PAGES.latest, ARMY_PAGES.all];

	let townHallsContainer = $state<HTMLUListElement | undefined>(undefined);
	let visibleTownHalls = $state<TownHall[]>([]);
</script>

<Menu bind:open {elRef} placementOffset={0} placement="bottom-end" --menu-width="min(855px, 90dvw)" fixed>
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div class="ca-menu armies-menu" tabindex="0" transition:fade={{ duration: 100 }}>
		<section>
			<h3>Armies</h3>
			<ul class="links">
				{#each ARMY_LINKS as link}
					<li>
						<LinkCard {...link.navOptions} img={link.img} imgAlt={link.imgAlt} />
					</li>
				{/each}
			</ul>
		</section>
		<section>
			<h3>By Town Hall</h3>
			<ul class="links" style="--column-gap: {TH_COL_GAP}px" bind:this={townHallsContainer}>
				{#each visibleTownHalls as th}
					{@const options = ARMY_PAGES.townHall(th.level)}
					<li>
						<LinkCard {...options.navOptions} img={options.img} imgAlt={options.imgAlt} />
					</li>
				{/each}
			</ul>
			<a class="other-link" href="/armies/town-halls">
				See all
				<svg viewBox="0 0 10 9" xmlns="http://www.w3.org/2000/svg">
					<path d="M1 4.5H9M9 4.5L5.8 1.5M9 4.5L5.8 7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</a>
		</section>
	</div>
</Menu>

<ResponsiveGridSlice
	items={townHalls}
	bind:visibleItems={visibleTownHalls}
	gridContainer={townHallsContainer}
	maxRows={TH_ROWS_MAX}
	colGap={TH_COL_GAP}
	thWidth={TH_WIDTH}
/>

<style>
	.armies-menu {
		display: flex;
		flex-flow: column nowrap;
		padding: 24px;
		gap: 32px;

		&:focus,
		&:focus-visible {
			outline: none;
		}

		& section {
			& h3 {
				text-align: left;
				font-family: 'Poppins', sans-serif;
				font-size: var(--fs);
				line-height: var(--fs);
				font-weight: 600;
				border-bottom: 1px solid var(--grey-550);
				text-transform: uppercase;
				letter-spacing: 1px;
				padding-bottom: 10px;
				margin-bottom: 12px;
			}

			& .links {
				display: flex;
				flex-flow: row wrap;
				align-items: center;
				column-gap: var(--column-gap, 24px);
				row-gap: 16px;
			}
		}
	}

	.other-link {
		display: inline-flex;
		align-items: center;
		color: var(--grey-400);
		font-size: var(--fs-sm);
		line-height: var(--fs-sm);
		text-transform: uppercase;
		letter-spacing: 1px;
		transition: color 0.1s ease;
		margin-top: 16px;
		gap: 4px;

		&:hover {
			color: var(--grey-100);
		}

		& svg {
			height: 8px;
			width: auto;
		}
	}
</style>
