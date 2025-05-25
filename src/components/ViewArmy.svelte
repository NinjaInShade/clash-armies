<script lang="ts">
	import { getContext, untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { VALID_HEROES, YOUTUBE_URL_REGEX } from '$shared/utils';
	import { copyLink, openInGame, getTags, getCopyBtnTitle, getOpenBtnTitle } from '$client/army';
	import { HTTPError, type APIErrors } from '$shared/http';
	import type { AppState } from '$types';
	import { ArmyModel, type Army } from '$models';
	import { invalidateAll } from '$app/navigation';
	import UnitTotals from './UnitTotals.svelte';
	import Votes from './Votes.svelte';
	import BookmarkButton from './BookmarkButton.svelte';
	import UnitsList from './UnitsList.svelte';
	import ActionButton from './ActionButton.svelte';
	import HeroDisplayFull from './HeroDisplayFull.svelte';
	import GuideEditor from './GuideEditor.svelte';
	import Errors from './Errors.svelte';
	import Button from './Button.svelte';
	import Comments from './Comments.svelte';

	type Props = { army: Army };
	const { army }: Props = $props();

	const app = getContext<AppState>('app');
	const model = $derived.by(() => {
		void army;
		return untrack(() => new ArmyModel(app, army));
	});
	const stats = $derived(model.getStats());

	const showClanCastle = $derived<boolean>(model.ccUnits.length > 0);
	const showHeroes = $state<boolean>(VALID_HEROES.some((hero) => model.hasHero(hero)));

	let errors = $state<APIErrors | null>(null);

	function getYoutubeEmbedSrc(url: string) {
		const match = url.match(YOUTUBE_URL_REGEX);
		if (!match || !match[1]) {
			return null;
		}
		const videoId = match[1];
		return `https://www.youtube.com/embed/${videoId}`;
	}

	async function deleteArmy() {
		const confirmed = await app.confirm('Are you sure you want to delete this army warrior? This cannot be undone!');
		if (!confirmed) {
			return;
		}

		try {
			await app.http.delete('/api/armies', model.id);
		} catch (err) {
			if (err instanceof HTTPError) {
				errors = err.errors ?? err.message;
			}
			return;
		}

		await invalidateAll();
		await goto(`/armies`);
	}
</script>

<svelte:head>
	<title>ClashArmies • {model.name} • TH{model.townHall} {stats.type} army attack strategy</title>
</svelte:head>

<section class="banner">
	<img class="banner-img" src="/clash/banners/{model.banner}.webp" alt="Clash of clans banner artwork" />
	<div class="banner-overlay"></div>
	<div class="banner-content">
		<div class="left">
			<div class="title-container">
				<img src="/clash/town-halls/{model.townHall}.png" alt="Town hall {model.townHall}" class="town-hall" />
				<h1>{model.name}</h1>
			</div>
			<p class="author">Assembled by <a href="/users/{model.username}">@{model.username}</a></p>
			<ul class="tags">
				{#each getTags(model) as tag}
					<li>
						{#if tag.icon}
							<tag.icon></tag.icon>
						{/if}
						{tag.label}
					</li>
				{/each}
			</ul>
		</div>
		<div class="right">
			<div class="actions">
				<Votes {model} allowEdit={app.user !== null} />
				{#if app.user}
					<div class="separator"></div>
					<BookmarkButton {model} />
				{/if}
			</div>
		</div>
	</div>
</section>

<section class="dashed units">
	<div class="top">
		<div class="title">
			<h2 class="dashed">
				<img src="/clash/ui/army-camp.png" alt="Clash of clans army camp" />
				Army camp
			</h2>
			<UnitTotals {model} housedIn="armyCamp" />
		</div>
		<UnitsList {model} housedIn="armyCamp" />
	</div>
	<div class="controls">
		<ActionButton
			ghost
			onclick={() => copyLink(model, app)}
			disabled={!model.units.length && !model.ccUnits.length && !model.pets.length && !model.equipment.length}
			title={getCopyBtnTitle(model)}
		>
			<svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path
					d="M3.4 3.4V0.849999C3.4 0.624565 3.48955 0.408365 3.64896 0.248959C3.80836 0.0895532 4.02456 0 4.25 0H14.45C14.6754 0 14.8916 0.0895532 15.051 0.248959C15.2104 0.408365 15.3 0.624565 15.3 0.849999V12.75C15.3 12.9754 15.2104 13.1916 15.051 13.351C14.8916 13.5104 14.6754 13.6 14.45 13.6H11.9V16.15C11.9 16.6192 11.5175 17 11.044 17H0.855949C0.743857 17.0007 0.632737 16.9792 0.528974 16.9368C0.42521 16.8944 0.330848 16.8319 0.25131 16.7529C0.171771 16.6739 0.108624 16.58 0.0654961 16.4765C0.0223682 16.373 0.000109968 16.2621 0 16.15L0.00255002 4.25C0.00255002 3.7808 0.38505 3.4 0.857649 3.4H3.4ZM1.7017 5.1L1.7 15.3H10.2V5.1H1.7017ZM5.1 3.4H11.9V11.9H13.6V1.7H5.1V3.4ZM3.4 7.64999H8.49999V9.34999H3.4V7.64999ZM3.4 11.05H8.49999V12.75H3.4V11.05Z"
					fill="currentColor"
				/>
			</svg>
			Copy link
		</ActionButton>
		<ActionButton
			ghost
			onclick={() => openInGame(model, app)}
			disabled={!model.units.length && !model.ccUnits.length && !model.pets.length && !model.equipment.length}
			title={getOpenBtnTitle(model)}
		>
			<svg width="18" height="12" viewBox="0 0 18 12" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path
					fill-rule="evenodd"
					clip-rule="evenodd"
					d="M16.6241 5.45391C15.87 1.24228 14.184 0 13.2871 0C11.8875 0 11.5284 1.04051 8.54967 1.07556C5.57093 1.04051 5.21184 0 3.81224 0C2.91537 0 1.22849 1.24228 0.474403 5.45391C0.0443491 7.85811 -0.422469 11.4473 0.689858 11.8782C2.07407 12.4143 2.54345 11.0737 4.0636 9.94084C5.60684 8.7926 6.34725 8.52243 8.54967 8.52243C10.7521 8.52243 11.4925 8.7926 13.0357 9.94084C14.5559 11.0728 15.0253 12.4143 16.4095 11.8782C17.5218 11.4473 17.055 7.85896 16.6241 5.45391ZM5.12976 6.00024C4.67625 6.00024 4.24132 5.82008 3.92064 5.4994C3.59996 5.17872 3.4198 4.74379 3.4198 4.29028C3.4198 3.83677 3.59996 3.40184 3.92064 3.08116C4.24132 2.76048 4.67625 2.58033 5.12976 2.58033C5.58327 2.58033 6.0182 2.76048 6.33888 3.08116C6.65956 3.40184 6.83972 3.83677 6.83972 4.29028C6.83972 4.74379 6.65956 5.17872 6.33888 5.4994C6.0182 5.82008 5.58327 6.00024 5.12976 6.00024ZM11.1146 6.00024C10.8879 6.00024 10.6704 5.91016 10.51 5.74982C10.3497 5.58948 10.2596 5.37202 10.2596 5.14526C10.2596 4.91851 10.3497 4.70104 10.51 4.5407C10.6704 4.38036 10.8879 4.29028 11.1146 4.29028C11.3414 4.29028 11.5588 4.38036 11.7192 4.5407C11.8795 4.70104 11.9696 4.91851 11.9696 5.14526C11.9696 5.37202 11.8795 5.58948 11.7192 5.74982C11.5588 5.91016 11.3414 6.00024 11.1146 6.00024ZM12.8246 4.29028C12.5978 4.29028 12.3803 4.2002 12.22 4.03986C12.0597 3.87952 11.9696 3.66206 11.9696 3.4353C11.9696 3.20855 12.0597 2.99108 12.22 2.83074C12.3803 2.6704 12.5978 2.58033 12.8246 2.58033C13.0513 2.58033 13.2688 2.6704 13.4291 2.83074C13.5895 2.99108 13.6795 3.20855 13.6795 3.4353C13.6795 3.66206 13.5895 3.87952 13.4291 4.03986C13.2688 4.2002 13.0513 4.29028 12.8246 4.29028Z"
					fill="currentColor"
				/>
			</svg>
			Open in-game
		</ActionButton>
	</div>
</section>

{#if showClanCastle}
	<section class="dashed units cc">
		<div class="top">
			<div class="title">
				<h2 class="dashed">
					<img src="/clash/ui/clan-castle.png" alt="Clash of clans clan castle" />
					Clan castle
				</h2>
				<UnitTotals {model} housedIn="clanCastle" />
			</div>
			<UnitsList {model} housedIn="clanCastle" />
		</div>
	</section>
{/if}

{#if showHeroes}
	<section class="dashed units heroes">
		<div class="top">
			<div>
				<h2 class="dashed">
					<img src="/clash/heroes/Barbarian King.png" alt="Clash of clans barbarian king hero" />
					Heroes
				</h2>
			</div>
			<div class="heroes-list">
				{#each VALID_HEROES as hero}
					{#if model.hasHero(hero)}
						<HeroDisplayFull {hero} {model} />
					{/if}
				{/each}
			</div>
		</div>
	</section>
{/if}

{#if model.guide}
	<section class="dashed guide">
		<div class="top">
			<div class="title">
				<h2 class="dashed">
					<img src="/clash/ui/bb-duel.png" alt="Clash of clans builder base swords" />
					Guide
				</h2>
			</div>
			{#if model.guide.textContent}
				<div class="guide-editor-container">
					<GuideEditor text={model.guide.textContent} mode="view" />
				</div>
			{/if}
			{#if model.guide.youtubeUrl}
				<div class="guide-youtube-container">
					<h2 class="video-guide-title">
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
		</div>
	</section>
{/if}

{#if errors}
	<div class="errors">
		<Errors {errors} />
	</div>
{/if}

<div class="army-controls">
	{#if app.user && (app.user.id === model.createdBy || app.user.hasRoles('admin'))}
		<Button onClick={deleteArmy} theme="danger">Delete</Button>
		<Button asLink href="/armies/edit/{model.id}">Edit</Button>
	{/if}
</div>

{#if app.user || (!app.user && model.comments.length)}
	<div class="comments-feed" id="comments">
		<Comments {model} />
	</div>
{/if}

<style>
	/* BANNER */
	.banner {
		overflow: hidden;
		position: relative;
		border-radius: 8px;
		width: 100%;
	}

	.banner-img {
		display: block;
		object-fit: cover;
		aspect-ratio: 1920 / 800;
		max-height: 350px;
		height: 100%;
		width: 100%;
	}

	.banner-overlay {
		position: absolute;
		background: hsla(0, 0%, 0%, 0.5);
		background: linear-gradient(0deg, hsla(0, 0%, 0%, 0.95) 0%, hsla(0, 0%, 0%, 0.65) 50%, hsla(0, 0%, 0%, 0) 100%);
		height: 100%;
		width: 100%;
		left: 0;
		top: 0;
	}

	.banner-content {
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
	}

	.banner-content .left .town-hall {
		flex-shrink: 0;
		max-height: 60px;
		width: auto;
	}
	.banner-content .left h1 {
		color: var(--grey-100);
		max-width: 500px;
	}
	.banner-content .left .author,
	.banner-content .left .author a {
		font-size: var(--fs);
		line-height: var(--fs-lh);
	}
	.banner-content .left .author {
		margin-bottom: 10px;
		color: var(--grey-100);
		font-weight: 500;
	}
	.banner-content .left .author a {
		color: var(--primary-400);
		font-weight: 700;
	}
	.banner-content .left .author a:hover {
		text-decoration: underline;
	}
	.banner-content .left .tags {
		display: flex;
		flex-flow: row wrap;
		gap: 6px;
	}
	.banner-content .left .tags li {
		display: flex;
		align-items: center;
		text-transform: uppercase;
		white-space: nowrap;
		background-color: #4c4538;
		color: #e0a553;
		font-size: 12px;
		line-height: 14px;
		font-weight: 700;
		border-radius: 4px;
		padding: 6px;
		gap: 4px;
	}

	.banner-content .right :global(.totals) {
		border-radius: 0;
		background: none;
		padding: 0;
	}
	.banner-content .right,
	.banner-content .actions {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.banner-content .right .separator {
		background-color: var(--grey-500);
		border-radius: 50%;
		width: 5px;
		height: 5px;
	}

	:global(.bookmark svg) {
		width: 13.2px;
		height: 17px;
	}

	/* DASHED SECTION */
	.dashed,
	.units :global(.totals) {
		background-color: var(--grey-800);
		border: 1px dashed var(--grey-500);
		border-radius: 8px;
	}
	.units :global(.totals) {
		margin-bottom: 16px;
	}

	.title {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	/* UNITS */
	.units {
		--unit-size: 70px;
		--unit-amount-size: 16px;
		--unit-lvl-size: 13px;
		--bottom-padding: 0;
		margin-top: 32px;
	}
	.guide {
		margin-top: 32px;
	}
	.units .top {
		padding: 0 24px 24px 24px;
		margin-top: -12px;
	}
	.guide .top {
		padding: 0;
		margin-top: -12px;
	}
	.guide .top .title {
		padding: 0 24px;
	}
	.units .top h2,
	.guide .top h2,
	.guide .top .video-guide-title {
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
		margin-bottom: 16px;
		padding: 6px 8px;
	}
	.guide .top .video-guide-title {
		padding: 0;
	}
	.units .top h2 img,
	.guide .top img {
		flex-shrink: 0;
		max-height: 24px;
		height: 100%;
		width: auto;
	}

	.units :global(.units-list) {
		padding: 0 8px;
	}

	.guide-editor-container {
		--editor-min-height: 0;
		padding: 0 32px 24px 32px;
		border-bottom: 1px dashed var(--grey-500);
	}
	.guide-youtube-container {
		display: flex;
		flex-flow: column nowrap;
		padding: 0 32px 24px 32px;
	}
	.guide :has(:global(.guide-editor-container)) .guide-youtube-container {
		padding-top: 24px;
	}
	.guide-youtube-container iframe {
		max-width: 800px;
		aspect-ratio: 16 / 9;
		width: 100%;
	}
	.guide-youtube-container .video-guide-title img {
		max-height: 18px;
	}

	.units .controls {
		display: flex;
		border-top: 1px dashed var(--grey-500);
		padding: 16px 32px;
		gap: 6px;
	}

	/* ARMY CONTROLS */
	.army-controls {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
	}
	.army-controls:not(:empty) {
		margin-top: 16px;
		padding-bottom: 16px;
		border-bottom: 1px dashed var(--grey-500);
	}

	.heroes-list {
		--hero-height: 100px;
		--unit-size: 48px;
		display: flex;
		justify-content: flex-start;
		align-items: flex-start;
		flex-wrap: wrap;
		padding: 0 8px;
		column-gap: 32px;
		row-gap: 24px;
	}

	.comments-feed {
		margin-top: 24px;
	}

	/* ERRORS */
	.errors {
		margin-top: 24px;
	}

	@media (max-width: 1000px) {
		.heroes-list {
			display: grid;
			grid-template-columns: repeat(2, auto);
		}
	}

	@media (max-width: 850px) {
		.units {
			--unit-size: 60px;
			--unit-amount-size: 14px;
			--unit-lvl-size: 11px;
		}
		.heroes-list {
			--hero-height: 90px;
			--unit-size: 42.5px;
			column-gap: 24px;
		}
		.errors {
			margin-top: 16px;
		}
		.army-controls {
			margin-top: 16px;
		}
		.banner-content .left .town-hall {
			max-height: 48px;
		}
		.comments-feed {
			margin-top: 16px;
		}
	}

	@media (max-width: 650px) {
		.banner-img {
			max-height: none;
			height: 450px;
		}
		.banner-content {
			flex-flow: column nowrap;
			align-items: flex-start;
			gap: 16px;
		}
	}

	@media (max-width: 550px) {
		.banner-content .right {
			flex-flow: row wrap;
		}
		.units .top {
			padding: 0 16px 24px 16px;
		}
		.units .controls {
			padding: 16px 24px;
		}
		.title {
			display: inline-flex;
			flex-flow: column nowrap;
			gap: 0;
		}
		.units .top .title > * {
			margin: 0;
			width: 100%;
		}
		.units .top .title h2 {
			border-bottom: none;
			padding-bottom: 0;
			margin-bottom: 0;
		}
		.units :global(.totals) {
			padding-top: 12px;
			border-radius: 0;
			border-top: none;
			width: 100%;
		}
		.guide .top .title {
			padding: 0 16px;
		}
		.guide-editor-container,
		.guide-youtube-container {
			padding: 0 24px 16px 24px;
		}
		.guide :has(:global(.guide-editor-container)) .guide-youtube-container {
			padding-top: 16px;
		}

		.banner-content {
			padding: 16px;
		}
	}

	@media (max-width: 450px) {
		.heroes-list {
			--hero-height: 84px;
			--unit-size: 40px;
			grid-template-columns: repeat(1, auto);
			row-gap: 16px;
		}
	}

	@media (max-width: 400px) {
		.controls :global(.action-btn) {
			justify-content: center;
			width: 100%;
		}
		.units .controls {
			flex-flow: column nowrap;
		}
		.units {
			--unit-amount-size: 13px;
			--unit-lvl-size: 10.5px;
		}
	}
</style>
