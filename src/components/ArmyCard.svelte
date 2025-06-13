<script lang="ts">
	import { VALID_HEROES } from '$shared/utils';
	import { ArmyModel } from '$models';
	import HeroDisplay from './HeroDisplay.svelte';
	import UnitTotals from './UnitTotals.svelte';
	import UnitsList from './UnitsList.svelte';
	import ArmyTags from './ArmyTags.svelte';
	import Votes from './Votes.svelte';
	import OpenInGameButton from './OpenInGameButton.svelte';
	import CommentsCount from './CommentsCount.svelte';
	import ShareButton from './ShareButton.svelte';
	import CtxMenu from './ArmyActionsMenu.svelte';

	type Props = {
		model: ArmyModel;
	};
	const { model }: Props = $props();

	let menuBtn = $state<HTMLButtonElement>();
	let menuOpen = $state(false);

	function toggleContextMenu() {
		menuOpen = !menuOpen;
	}
</script>

{#snippet extraUnits()}
	{#if model.ccUnits.length > 0}
		<li class="clan-castle">
			<img src="/clash/ui/clan-castle.webp" alt="Clash of clans clan castle" title="Has clan castle" />
		</li>
	{/if}
	{#each VALID_HEROES as hero}
		{#if model.hasHero(hero)}
			<li>
				<HeroDisplay name={hero} />
			</li>
		{/if}
	{/each}
{/snippet}

<li class="army-card">
	<header class="header">
		<div class="top">
			<a class="title-container" href="/armies/{model.id}">
				<img src="/clash/town-halls/{model.townHall}_small.webp" alt="Town hall {model.townHall}" class="town-hall" title="Town hall {model.townHall}" />
				<h3>{model.name}</h3>
			</a>
			<button class="context-menu-btn" aria-label="context-menu" bind:this={menuBtn} onclick={toggleContextMenu}>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5 16">
					<path
						d="M2.28571 16C3.54808 16 4.57143 14.9767 4.57143 13.7143C4.57143 12.4519 3.54808 11.4286 2.28571 11.4286C1.02335 11.4286 0 12.4519 0 13.7143C0 14.9767 1.02335 16 2.28571 16Z"
						fill="currentColor"
					/>
					<path
						d="M2.28571 10.2856C3.54808 10.2856 4.57143 9.2623 4.57143 7.99994C4.57143 6.73758 3.54808 5.71423 2.28571 5.71423C1.02335 5.71423 0 6.73758 0 7.99994C0 9.2623 1.02335 10.2856 2.28571 10.2856Z"
						fill="currentColor"
					/>
					<path
						d="M2.28571 4.57141C3.54808 4.57141 4.57143 3.54806 4.57143 2.2857C4.57143 1.02334 3.54808 0 2.28571 0C1.02335 0 0 1.02334 0 2.2857C0 3.54806 1.02335 4.57141 2.28571 4.57141Z"
						fill="currentColor"
					/>
				</svg>
			</button>
		</div>
		<div class="bottom">
			<ArmyTags {model} />
			<UnitTotals {model} housedIn="armyCamp" />
		</div>
	</header>
	<a href="/armies/{model.id}">
		<UnitsList {model} {extraUnits} housedIn="armyCamp" display="block" />
	</a>
	<footer class="controls">
		<div>
			<Votes {model} />
			<CommentsCount {model} />
		</div>
		<div>
			<ShareButton {model} />
			<OpenInGameButton {model} />
		</div>
	</footer>
</li>

<CtxMenu bind:menuOpen bind:menuBtnRef={menuBtn} {model} />

<style>
	.army-card {
		--hero-height: 74.5px;
		--hero-width: 56px;
		--unit-size: 56px;
		--unit-amount-size: 14px;
		--unit-lvl-size: 13px;
		--bottom-padding: 0;

		background-color: var(--grey-800);
		border: 1px dashed var(--grey-500);
		border-radius: 8px;
		overflow: hidden;
		width: 100%;

		& :global(.units-list:not(.removable) li button) {
			cursor: pointer;
		}

		& :global(.units-list) {
			border: 1px dashed var(--grey-500);
			border-left: none;
			border-right: none;
			padding: 16px;
		}

		& .header {
			display: flex;
			flex-flow: column nowrap;
			justify-content: space-between;
			padding: 10px 16px;
			gap: 6px;

			.top,
			.bottom {
				display: flex;
				justify-content: space-between;
				align-items: center;
				gap: 0.75em;
			}

			& .title-container {
				display: flex;
				align-items: center;
				gap: 4px;

				& .town-hall {
					flex-shrink: 0;
					width: auto;
					max-height: 26px;
				}

				& h3 {
					color: var(--primary-400);
					font-size: 18px;
					line-height: 18px;
					margin-left: 2px;
				}
			}

			& :global(.totals) {
				background: none;
				border-radius: 0;
				padding: 0;
				gap: 8px;

				& :global(small) {
					font-size: 14px;
					line-height: 14px;
				}

				& :global(img) {
					display: block;
					max-height: 16px;
					height: 100%;
					width: auto;
				}
			}

			@media (max-width: 700px) {
				& .bottom {
					flex-flow: column nowrap;
					align-items: flex-start;
				}
			}
		}

		& .controls {
			display: flex;
			flex-flow: row wrap;
			justify-content: space-between;
			padding: 12px 16px;
			gap: 0.5em;

			& > div {
				display: flex;
				gap: 0.5em;
			}
		}

		& .clan-castle {
			display: flex;
			align-items: center;
			justify-content: center;
			background-color: #3d3d3d;
			border-radius: 4px;
			padding: 4px;
			width: var(--unit-size);

			& img {
				max-height: 48px;
				width: auto;
			}
		}

		@media (max-width: 400px) {
			--unit-amount-size: 14px;
			--unit-lvl-size: 13px;
		}
	}
</style>
