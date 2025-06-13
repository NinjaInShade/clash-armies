<script lang="ts">
	import { getContext, untrack } from 'svelte';
	import { VALID_HEROES, YOUTUBE_URL_REGEX } from '$shared/utils';
	import type { AppState } from '$types';
	import { ArmyModel, type Army } from '$models';
	import UnitTotals from './UnitTotals.svelte';
	import Votes from './Votes.svelte';
	import UnitsList from './UnitsList.svelte';
	import HeroDisplayFull from './HeroDisplayFull.svelte';
	import GuideEditor from './GuideEditor.svelte';
	import Button from './Button.svelte';
	import ArmyTags from './ArmyTags.svelte';
	import OpenInGameButton from './OpenInGameButton.svelte';
	import CommentsCount from './CommentsCount.svelte';
	import ShareButton from './ShareButton.svelte';
	import CtxMenu from './ArmyActionsMenu.svelte';
	import CommentsList from './CommentsList.svelte';
	import AddComment from './SaveComment.svelte';

	type Props = { army: Army };
	const { army }: Props = $props();

	const app = getContext<AppState>('app');
	const model = $derived.by(() => {
		void army;
		return untrack(() => new ArmyModel(app, army));
	});

	const stats = $derived(model.getStats());
	const heroes = $derived(VALID_HEROES.filter((hero) => model.hasHero(hero)));

	let menuBtn = $state<HTMLButtonElement>();
	let menuOpen = $state(false);

	function getYoutubeEmbedSrc(url: string) {
		const match = url.match(YOUTUBE_URL_REGEX);
		if (!match || !match[1]) {
			return null;
		}
		const videoId = match[1];
		return `https://www.youtube.com/embed/${videoId}`;
	}

	function toggleContextMenu() {
		menuOpen = !menuOpen;
	}
</script>

<svelte:head>
	<title>ClashArmies • {model.name} • TH{model.townHall} {stats.type} army attack strategy</title>
</svelte:head>

<section class="banner">
	<picture>
		<source srcset="/clash/banners/{model.banner}.webp" media="(max-width: 900px)" />
		<img class="banner-img" src="/clash/banners/{model.banner}_large.webp" alt="Clash of clans banner artwork" />
	</picture>
	<div class="banner-overlay"></div>
	<div class="banner-content">
		<div class="left">
			<div class="title-container">
				<img src="/clash/town-halls/{model.townHall}.webp" alt="Town hall {model.townHall}" class="town-hall" />
				<h1>{model.name}</h1>
			</div>
			<p class="author">Assembled by <a href="/users/{model.username}">@{model.username}</a></p>
			<ArmyTags {model} tagStyle="padding: 6px" />
		</div>
		<div class="right">
			{#if app.user && (app.user.id === model.createdBy || app.user.hasRoles('admin'))}
				<Button asLink href="/armies/edit/{model.id}">Edit</Button>
			{/if}
		</div>
	</div>
</section>

<section class="dashed dashed-section units">
	<header>
		<h2 class="dashed dashed-title">
			<img src="/clash/ui/army-camp.webp" alt="Clash of clans army camp" />
			Army camp
		</h2>
		<UnitTotals {model} housedIn="armyCamp" />
	</header>
	<div class="units-list">
		<UnitsList {model} housedIn="armyCamp" />
	</div>
</section>

{#if model.ccUnits.length}
	<section class="dashed dashed-section units">
		<header>
			<h2 class="dashed dashed-title">
				<img src="/clash/ui/clan-castle.webp" alt="Clash of clans clan castle" />
				Clan castle
			</h2>
			<UnitTotals {model} housedIn="clanCastle" />
		</header>
		<div class="units-list">
			<UnitsList {model} housedIn="clanCastle" />
		</div>
	</section>
{/if}

{#if heroes.length}
	<section class="dashed dashed-section units heroes">
		<header>
			<h2 class="dashed dashed-title">
				<img src="/clash/heroes/Barbarian King.webp" alt="Clash of clans barbarian king hero" />
				Heroes
			</h2>
		</header>
		<div class="heroes-list">
			{#each VALID_HEROES as hero}
				{#if model.hasHero(hero)}
					<HeroDisplayFull {hero} {model} />
				{/if}
			{/each}
		</div>
	</section>
{/if}

{#if model.guide}
	<section class="dashed dashed-section guide">
		<header>
			<h2 class="dashed dashed-title">
				<img src="/clash/ui/bb-duel.webp" alt="Clash of clans builder base swords" />
				Guide
			</h2>
		</header>
		{#if model.guide.textContent}
			<div class="guide-editor-container">
				<GuideEditor text={model.guide.textContent} mode="view" />
			</div>
		{/if}
		{#if model.guide.youtubeUrl}
			<div class="guide-youtube-container">
				<h2 class="dashed-title">
					<img src="/icons/youtube-coloured.png" alt="Youtube icon" />
					Video guide
				</h2>
				<iframe
					src={getYoutubeEmbedSrc(model.guide.youtubeUrl)}
					allowfullscreen={true}
					autoplay={false}
					disablekbcontrols={false}
					enableiframeapi={false}
					endtime="0"
					ivloadpolicy="0"
					loop={false}
					modestbranding={false}
					origin=""
					playlist=""
					start="0"
					title="Army video guide"
				></iframe>
			</div>
		{/if}
	</section>
{/if}

<div class="toolbar">
	<div>
		<Votes {model} size="large" />
		<CommentsCount {model} size="large" />
	</div>
	<div>
		<ShareButton {model} size="large" />
		<OpenInGameButton {model} size="large" />
		<button class="utility-btn large" aria-label="context-menu" bind:this={menuBtn} onclick={toggleContextMenu}>
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
</div>

<div class="comments-feed" class:has-comments={model.comments.length > 0} id="comments">
	<CommentsList {model} comments={model.structuredComments} />

	<div class="add-comment">
		<AddComment {model} />
	</div>
</div>

<CtxMenu bind:menuOpen bind:menuBtnRef={menuBtn} {model} hideViewArmyLink />

<style>
	.banner {
		overflow: hidden;
		position: relative;
		border-radius: 8px;
		width: 100%;

		& .banner-img {
			display: block;
			object-fit: cover;
			aspect-ratio: 1920 / 800;
			max-height: 350px;
			height: 100%;
			width: 100%;

			@media (max-width: 650px) {
				height: 350px;
			}
		}

		& .banner-overlay {
			position: absolute;
			background: hsla(0, 0%, 0%, 0.5);
			background: linear-gradient(0deg, hsla(0, 0%, 0%, 0.95) 0%, hsla(0, 0%, 0%, 0.65) 50%, hsla(0, 0%, 0%, 0) 100%);
			height: 100%;
			width: 100%;
			left: 0;
			top: 0;
		}

		& .banner-content {
			display: flex;
			justify-content: space-between;
			align-items: flex-end;
			padding: 24px;
			position: absolute;
			width: 100%;
			bottom: 0;
			left: 0;

			& .title-container {
				display: flex;
				flex-flow: column nowrap;
				align-items: flex-start;
				gap: 0.4em;

				& h1 {
					font-size: var(--h2-lg);
					line-height: var(--h2-lg-lh);
				}
			}

			& .author {
				margin-bottom: 10px;
				color: var(--grey-100);
				font-weight: 500;

				@media (max-width: 850px) {
					margin-top: 4px;
				}
			}

			& .left {
				& .town-hall {
					flex-shrink: 0;
					max-height: 60px;
					width: auto;

					@media (max-width: 850px) {
						max-height: 48px;
					}
				}

				& h1 {
					color: var(--grey-100);
					max-width: 500px;
				}

				& .author {
					font-size: var(--fs);
					line-height: var(--fs-lh);
				}

				& .author a {
					color: var(--primary-400);
					font-weight: 700;

					&:hover {
						text-decoration: underline;
					}
				}
			}

			& .right {
				display: flex;
				flex-flow: row wrap;
				align-items: center;
				gap: 8px;

				&:empty {
					display: none;
				}
			}

			@media (max-width: 650px) {
				flex-flow: column nowrap;
				align-items: flex-start;
				padding: 20px 16px;
				gap: 16px;
			}
		}
	}

	.dashed {
		background-color: var(--grey-800);
		border: 1px dashed var(--grey-500);
		border-radius: 8px;
	}

	.dashed-section {
		margin-top: 32px;

		& header {
			display: flex;
			justify-content: space-between;
			align-items: center;

			@media (max-width: 550px) {
				display: inline-flex;
				flex-flow: column nowrap;

				& > * {
					width: 100%;
				}

				/* Global CSS because svelte doesn't recognize it otherwise */
				& :global(.dashed-title:has(+ *)) {
					padding-bottom: 0;
					margin-bottom: 0;
					border-bottom: none;
				}
			}
		}

		> :first-child {
			margin-top: -12px;
			margin-bottom: 16px;
		}

		> :last-child {
			padding-bottom: 24px;
		}

		> * {
			padding-left: 24px;
			padding-right: 24px;

			&:not(:first-child) {
				padding-left: 32px;
				padding-right: 32px;
			}
		}

		@media (max-width: 550px) {
			> * {
				padding-left: 16px;
				padding-right: 16px;

				&:not(:first-child) {
					padding-left: 24px;
					padding-right: 24px;
				}
			}
		}
	}

	.dashed-title {
		display: inline-flex;
		align-items: center;
		gap: 0.5em;
		font-family: 'Poppins', sans-serif;
		font-size: var(--fs);
		line-height: var(--fs-lh);
		color: var(--grey-100);
		font-weight: bold;
		letter-spacing: 2px;
		text-transform: uppercase;
		border-radius: 4px;
		padding: 6px 8px;

		& img {
			flex-shrink: 0;
			max-height: 24px;
			height: 100%;
			width: auto;
		}
	}

	.units {
		--unit-size: 70px;
		--unit-amount-size: 16px;
		--unit-lvl-size: 13px;
		--bottom-padding: 0;

		& :global(.totals) {
			background-color: var(--grey-800);
			border: 1px dashed var(--grey-500);
			border-radius: 8px;

			@media (max-width: 550px) {
				padding-top: 12px;
				border-radius: 0;
				border-top: none;
				width: 100%;
			}
		}

		@media (max-width: 850px) {
			--unit-size: 60px;
			--unit-amount-size: 14px;
			--unit-lvl-size: 11px;
		}

		@media (max-width: 400px) {
			--unit-amount-size: 13px;
			--unit-lvl-size: 10.5px;
		}
	}

	.heroes-list {
		--hero-height: 112px;
		--unit-size: 54px;
		display: flex;
		justify-content: flex-start;
		align-items: flex-start;
		flex-wrap: wrap;
		column-gap: 32px;
		row-gap: 24px;

		@media (max-width: 1000px) {
			display: grid;
			grid-template-columns: repeat(2, auto);
		}

		@media (max-width: 850px) {
			--hero-height: 100px;
			--unit-size: 48px;
			column-gap: 24px;
		}

		@media (max-width: 500px) {
			grid-template-columns: repeat(1, auto);
			row-gap: 16px;
		}
	}

	.guide {
		--editor-min-height: 0;

		& .guide-editor-container {
			padding-bottom: 24px;
		}

		& .guide-youtube-container {
			display: flex;
			flex-flow: column nowrap;

			& .dashed-title {
				padding: 0;
				margin-bottom: 16px;

				& img {
					max-height: 18px;
				}
			}

			& iframe {
				max-width: 800px;
				aspect-ratio: 16 / 9;
				width: 100%;
			}
		}

		&:has(.guide-editor-container) .guide-youtube-container {
			border-top: 1px dashed var(--grey-500);
			padding-top: 16px;
		}
	}

	.toolbar {
		--bg-clr: var(--grey-800);

		display: flex;
		flex-flow: row wrap;
		justify-content: space-between;
		border-radius: 8px;
		margin-top: 24px;
		gap: 0.25em;

		& > div {
			display: flex;
			flex-flow: row wrap;
			gap: 0.25em;
		}
	}

	.comments-feed {
		margin-top: 10px;

		&.has-comments {
			& .add-comment {
				margin-top: 10px;
			}
		}
	}
</style>
