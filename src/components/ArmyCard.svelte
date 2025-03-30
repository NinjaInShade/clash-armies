<script lang="ts">
	import { getContext } from 'svelte';
	import type { Army, AppState } from '$types';
	import { VALID_HEROES, getTotals, getCapacity, hasHero } from '$shared/utils';
	import { getTags, copyLink, openInGame, getCopyBtnTitle, getOpenBtnTitle } from '$client/army';
	import HeroDisplay from './HeroDisplay.svelte';
	import UnitTotals from './UnitTotals.svelte';
	import Votes from './Votes.svelte';
	import BookmarkButton from './BookmarkButton.svelte';
	import UnitsList from './UnitsList.svelte';
	import ActionButton from './ActionButton.svelte';

	type Props = {
		army: Army;
		showBookmark?: boolean;
	};
	const { army, showBookmark = true }: Props = $props();
	const app = getContext<AppState>('app');

	const thData = $derived(app.townHalls.find((th) => th.level === army.townHall));
	const units = $derived(army.units.filter((unit) => unit.home === 'armyCamp'));
	const ccUnits = $state(army.units.filter((unit) => unit.home === 'clanCastle'));
	const housingSpaceUsed = $derived.by(() => getTotals(units));
	const capacity = $derived.by(() => getCapacity(thData));

	let votes = $state<number>(army.votes);
	let userVote = $state<number>(army.userVote ?? 0);
</script>

{#snippet extraUnits()}
	{#if ccUnits.length > 0}
		<li class="clan-castle">
			<img src="/clash/ui/clan-castle.png" alt="Clash of clans clan castle" title="Has clan castle" />
		</li>
	{/if}
	{#each VALID_HEROES as hero}
		{#if hasHero(hero, army)}
			<li>
				<HeroDisplay name={hero} />
			</li>
		{/if}
	{/each}
{/snippet}

<li class="army-card">
	<div class="header">
		<div class="top">
			<a class="title-container" href="/armies/{army.id}">
				<img src="/clash/town-halls/{army.townHall}.png" alt="Town hall {army.townHall}" class="town-hall" title="Town hall {army.townHall}" />
				<h3>{army.name}</h3>
			</a>
			<ul class="tags">
				{#each getTags(army) as tag}
					<li>
						{#if tag.icon}
							<tag.icon />
						{/if}
						{tag.label}
					</li>
				{/each}
			</ul>
		</div>
		<div class="right">
			<UnitTotals used={housingSpaceUsed} {capacity} />
			<div class="separator"></div>
			<div class="actions">
				<Votes bind:votes bind:userVote armyId={army.id} allowEdit={app.user !== null} class="card-votes" />
				{#if app.user && showBookmark}
					<div class="separator"></div>
					<BookmarkButton {army} />
				{/if}
			</div>
		</div>
	</div>
	<UnitsList selectedUnits={units} display="block" {extraUnits} />
	<div class="controls">
		<div>
			{#if army.comments.length}
				<a class="comments-count" href="/armies/{army.id}#comments">
					<svg width="23" height="18" viewBox="0 0 27 21" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path
							d="M19.5 7.5C19.5 3.35625 15.1359 0 9.75 0C4.36406 0 0 3.35625 0 7.5C0 9.10781 0.660937 10.5891 1.78125 11.8125C1.15312 13.2281 0.117187 14.3531 0.103125 14.3672C0 14.475 -0.028125 14.6344 0.0328125 14.775C0.09375 14.9156 0.225 15 0.375 15C2.09062 15 3.51094 14.4234 4.53281 13.8281C6.04219 14.5641 7.82812 15 9.75 15C15.1359 15 19.5 11.6438 19.5 7.5ZM25.2187 17.8125C26.3391 16.5938 27 15.1078 27 13.5C27 10.3641 24.4922 7.67812 20.9391 6.55781C20.9812 6.86719 21 7.18125 21 7.5C21 12.4641 15.9516 16.5 9.75 16.5C9.24375 16.5 8.75156 16.4625 8.26406 16.4109C9.74062 19.1063 13.2094 21 17.25 21C19.1719 21 20.9578 20.5688 22.4672 19.8281C23.4891 20.4234 24.9094 21 26.625 21C26.775 21 26.9109 20.9109 26.9672 20.775C27.0281 20.6391 27 20.4797 26.8969 20.3672C26.8828 20.3531 25.8469 19.2328 25.2187 17.8125Z"
							fill="currentColor"
						/>
					</svg>
					{army.comments.length}
					{army.comments.length === 1 ? 'comment' : 'comments'}
				</a>
			{/if}
		</div>
		<div>
			<ActionButton ghost onclick={() => copyLink(units, app)} disabled={!units.length} title={getCopyBtnTitle(units)}>
				<svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M3.4 3.4V0.849999C3.4 0.624565 3.48955 0.408365 3.64896 0.248959C3.80836 0.0895532 4.02456 0 4.25 0H14.45C14.6754 0 14.8916 0.0895532 15.051 0.248959C15.2104 0.408365 15.3 0.624565 15.3 0.849999V12.75C15.3 12.9754 15.2104 13.1916 15.051 13.351C14.8916 13.5104 14.6754 13.6 14.45 13.6H11.9V16.15C11.9 16.6192 11.5175 17 11.044 17H0.855949C0.743857 17.0007 0.632737 16.9792 0.528974 16.9368C0.42521 16.8944 0.330848 16.8319 0.25131 16.7529C0.171771 16.6739 0.108624 16.58 0.0654961 16.4765C0.0223682 16.373 0.000109968 16.2621 0 16.15L0.00255002 4.25C0.00255002 3.7808 0.38505 3.4 0.857649 3.4H3.4ZM1.7017 5.1L1.7 15.3H10.2V5.1H1.7017ZM5.1 3.4H11.9V11.9H13.6V1.7H5.1V3.4ZM3.4 7.64999H8.49999V9.34999H3.4V7.64999ZM3.4 11.05H8.49999V12.75H3.4V11.05Z"
						fill="black"
					/>
				</svg>
				Copy link
			</ActionButton>
			<ActionButton ghost onclick={() => openInGame(units)} disabled={!units.length} title={getOpenBtnTitle(units)}>
				<svg width="18" height="12" viewBox="0 0 18 12" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						fill-rule="evenodd"
						clip-rule="evenodd"
						d="M16.6241 5.45391C15.87 1.24228 14.184 0 13.2871 0C11.8875 0 11.5284 1.04051 8.54967 1.07556C5.57093 1.04051 5.21184 0 3.81224 0C2.91537 0 1.22849 1.24228 0.474403 5.45391C0.0443491 7.85811 -0.422469 11.4473 0.689858 11.8782C2.07407 12.4143 2.54345 11.0737 4.0636 9.94084C5.60684 8.7926 6.34725 8.52243 8.54967 8.52243C10.7521 8.52243 11.4925 8.7926 13.0357 9.94084C14.5559 11.0728 15.0253 12.4143 16.4095 11.8782C17.5218 11.4473 17.055 7.85896 16.6241 5.45391ZM5.12976 6.00024C4.67625 6.00024 4.24132 5.82008 3.92064 5.4994C3.59996 5.17872 3.4198 4.74379 3.4198 4.29028C3.4198 3.83677 3.59996 3.40184 3.92064 3.08116C4.24132 2.76048 4.67625 2.58033 5.12976 2.58033C5.58327 2.58033 6.0182 2.76048 6.33888 3.08116C6.65956 3.40184 6.83972 3.83677 6.83972 4.29028C6.83972 4.74379 6.65956 5.17872 6.33888 5.4994C6.0182 5.82008 5.58327 6.00024 5.12976 6.00024ZM11.1146 6.00024C10.8879 6.00024 10.6704 5.91016 10.51 5.74982C10.3497 5.58948 10.2596 5.37202 10.2596 5.14526C10.2596 4.91851 10.3497 4.70104 10.51 4.5407C10.6704 4.38036 10.8879 4.29028 11.1146 4.29028C11.3414 4.29028 11.5588 4.38036 11.7192 4.5407C11.8795 4.70104 11.9696 4.91851 11.9696 5.14526C11.9696 5.37202 11.8795 5.58948 11.7192 5.74982C11.5588 5.91016 11.3414 6.00024 11.1146 6.00024ZM12.8246 4.29028C12.5978 4.29028 12.3803 4.2002 12.22 4.03986C12.0597 3.87952 11.9696 3.66206 11.9696 3.4353C11.9696 3.20855 12.0597 2.99108 12.22 2.83074C12.3803 2.6704 12.5978 2.58033 12.8246 2.58033C13.0513 2.58033 13.2688 2.6704 13.4291 2.83074C13.5895 2.99108 13.6795 3.20855 13.6795 3.4353C13.6795 3.66206 13.5895 3.87952 13.4291 4.03986C13.2688 4.2002 13.0513 4.29028 12.8246 4.29028Z"
						fill="#53E059"
					/>
				</svg>
				Open in-game
			</ActionButton>
			<ActionButton asLink href="/armies/{army.id}">
				<svg width="18" height="12" viewBox="0 0 18 12" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M8.8 3.6C8.16348 3.6 7.55303 3.85286 7.10294 4.30294C6.65286 4.75303 6.4 5.36348 6.4 6C6.4 6.63652 6.65286 7.24697 7.10294 7.69706C7.55303 8.14714 8.16348 8.4 8.8 8.4C9.43652 8.4 10.047 8.14714 10.4971 7.69706C10.9471 7.24697 11.2 6.63652 11.2 6C11.2 5.36348 10.9471 4.75303 10.4971 4.30294C10.047 3.85286 9.43652 3.6 8.8 3.6ZM8.8 10C7.73913 10 6.72172 9.57857 5.97157 8.82843C5.22143 8.07828 4.8 7.06087 4.8 6C4.8 4.93913 5.22143 3.92172 5.97157 3.17157C6.72172 2.42143 7.73913 2 8.8 2C9.86087 2 10.8783 2.42143 11.6284 3.17157C12.3786 3.92172 12.8 4.93913 12.8 6C12.8 7.06087 12.3786 8.07828 11.6284 8.82843C10.8783 9.57857 9.86087 10 8.8 10ZM8.8 0C4.8 0 1.384 2.488 0 6C1.384 9.512 4.8 12 8.8 12C12.8 12 16.216 9.512 17.6 6C16.216 2.488 12.8 0 8.8 0Z"
						fill="#53E059"
					/>
				</svg>
				View army
			</ActionButton>
		</div>
	</div>
</li>

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
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		padding: 10px 16px;
		gap: 0.75em;
	}
	.header .top {
		display: flex;
		flex-flow: column;
		align-items: flex-start;
	}
	.header .title-container {
		display: flex;
		align-items: center;
		gap: 4px;
	}
	.header h3 {
		color: var(--primary-400);
		word-break: break-all;
		font-size: 18px;
		line-height: 18px;
		margin-left: 2px;
	}
	.header .town-hall {
		flex-shrink: 0;
		width: auto;
	}
	.header .town-hall {
		max-height: 26px;
	}
	.header .right,
	.header .actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.header .right :global(.totals) {
		background: none;
		border-radius: 0;
		padding: 0;
		gap: 8px;
	}
	.header .right :global(.totals small) {
		font-size: 14px;
		line-height: 14px;
	}
	.header .right :global(.totals img) {
		display: block;
		max-height: 16px;
		height: 100%;
		width: auto;
	}
	.header .right .separator {
		background-color: var(--grey-500);
		height: 22px;
		width: 1px;
	}
	.header .right :global(.card-votes b) {
		font-size: 14px;
		line-height: 14px;
	}
	.header .right :global(.card-votes svg) {
		max-height: 14px;
		width: auto;
	}
	.header .tags {
		margin-top: 6px;
		display: flex;
		flex-flow: row wrap;
		gap: 4px;
	}
	.header .tags li {
		display: flex;
		align-items: center;
		text-transform: uppercase;
		background-color: #4c4538;
		color: #e0a553;
		font-size: 12px;
		line-height: 14px;
		font-weight: 700;
		border-radius: 4px;
		padding: 4px 6px;
		gap: 4px;
	}
	.header .tags li :global(svg) {
		display: block;
		flex-shrink: 0;
	}

	.army-card :global(.units-list) {
		border: 1px dashed var(--grey-500);
		border-left: none;
		border-right: none;
		padding: 16px;
	}

	.controls {
		display: flex;
		flex-flow: row wrap;
		justify-content: space-between;
		padding: 14px 16px;
		gap: 0.5em;
	}
	.controls > div {
		display: flex;
		gap: 0.5em;
	}

	.clan-castle {
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #3d3d3d;
		border-radius: 4px;
		padding: 4px;
		width: var(--unit-size);
	}
	.clan-castle img {
		max-height: 48px;
		width: auto;
	}

	.comments-count {
		display: flex;
		align-items: center;
		color: var(--grey-400);
		font-weight: 500;
		gap: 6px;
	}

	@media (max-width: 850px) {
		.army-card {
			--unit-amount-size: 14px;
			--unit-lvl-size: 11px;
		}
	}

	@media (max-width: 815px) {
		.header {
			flex-flow: column nowrap;
			align-items: flex-start;
		}
	}

	@media (max-width: 550px) {
		.controls,
		.controls > div {
			flex-flow: column nowrap;
		}
		.controls :global(.action-btn) {
			justify-content: center;
			width: 100%;
		}
		.comments-count {
			margin-bottom: 0.25em;
		}
	}

	@media (max-width: 475px) {
		.header .right :global(.totals) {
			flex-flow: row wrap;
		}
		.header .right {
			flex-flow: column;
			align-items: flex-start;
			gap: 0.75em;
		}
		.header .right > .separator {
			display: none;
		}
	}

	@media (max-width: 400px) {
		.army-card {
			--unit-amount-size: 14px;
			--unit-lvl-size: 13px;
		}
		.header .tags {
			flex-flow: row wrap;
		}
	}
</style>
