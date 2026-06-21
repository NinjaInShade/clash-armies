<script lang="ts">
	import { getContext } from 'svelte';
	import type { AppState } from '$types';
	import { ArmyModel } from '$models';
	import { thImgURL } from '$client/assets';
	import HeroDisplay from './HeroDisplay.svelte';
	import UnitTotals from './UnitTotals.svelte';
	import UnitsList from './UnitsList.svelte';
	import ArmyTags from './ArmyTags.svelte';
	import Votes from './Votes.svelte';
	import OpenInGameButton from './OpenInGameButton.svelte';
	import CommentsCount from './CommentsCount.svelte';
	import ShareButton from './ShareButton.svelte';
	import CtxMenu from './ArmyActionsMenu.svelte';
	import ImgClanCastle from '$assets/ui/clan-castle.webp';

	type Props = {
		model: ArmyModel;
	};
	const { model }: Props = $props();

	const app = getContext<AppState>('app');
	const downloads = $derived(model.openLinkClicks + model.copyLinkClicks);

	let menuBtn = $state<HTMLButtonElement>();
	let menuOpen = $state(false);

	function toggleContextMenu() {
		menuOpen = !menuOpen;
	}
</script>

{#snippet extraUnits()}
	{#if model.ccUnits.length > 0}
		<li class="clan-castle">
			<img src={ImgClanCastle} alt="Clash of clans clan castle" title="Has clan castle" />
		</li>
	{/if}
	{#each app.heroNames as hero (hero)}
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
				<img src={thImgURL(model.townHall, 'small')} alt="Town hall {model.townHall}" class="town-hall" title="Town hall {model.townHall}" />
				<h3>{model.name}</h3>
				<span class="downloads">
					<svg width="14" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path
							d="M0 12.6667H13.3333V14.6667H0V12.6667ZM12 4.66667V6H11.3333V6.66667H10.6667V7.33333H10V8H9.33333V8.66667H8.66667V9.33333H8V10H7.33333V10.6667H6V10H5.33333V9.33333H4.66667V8.66667H4V8H3.33333V7.33333H2.66667V6.66667H2V6H1.33333V4.66667H2V4H3.33333V4.66667H4V5.33333H4.66667V6H5.33333V0H8V6H8.66667V5.33333H9.33333V4.66667H10V4H11.3333V4.66667H12Z"
							fill="currentColor"
						/>
					</svg>
					{downloads}
				</span>
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
				min-width: 0;

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
					overflow: hidden;
					white-space: nowrap;
					text-overflow: ellipsis;
				}

				& .downloads {
					display: flex;
					align-items: center;
					color: var(--grey-450);
					font-size: var(--fs-sm);
					line-height: var(--fs-sm);
					font-family: 'Clash';
					margin-left: 6px;
					gap: 2.5px;

					& svg {
						position: relative;
						/* Optical alignment */
						bottom: 1px;
						max-height: 13px;
						width: auto;
					}
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
