<script lang="ts">
	import { getContext } from 'svelte';
	import { goto } from '$app/navigation';
	import { getTotals } from '~/lib/shared/utils';
	import { formatTime, copyLink, openInGame, getTags, getCopyBtnTitle, getOpenBtnTitle } from '~/lib/client/army';
	import type { Army, AppState, FetchErrors } from '~/lib/shared/types';
	import C from '~/components';

	type Props = { army: Army };
	const { army }: Props = $props();
	const { units } = $derived(army);

	const app = getContext<AppState>('app');

	let errors = $state<FetchErrors | null>(null);

	let _troopUnits = $derived(units.filter((item) => item.type === 'Troop'));
	let troopUnits = $derived([..._troopUnits.filter((x) => !x.isSuper), ..._troopUnits.filter((x) => x.isSuper)]);
	let siegeUnits = $derived(units.filter((item) => item.type === 'Siege'));
	let spellUnits = $derived(units.filter((item) => item.type === 'Spell'));

	let votes = $state<number>(army.votes);
	let userVote = $state<number>(army.userVote ?? 0);

	const housingSpaceUsed = $derived.by(() => getTotals(units));

	async function deleteArmy() {
		if (!army) return;
		const confirmed = await app.confirm('Are you sure you want to delete this army warrior? This cannot be undone!');
		if (!confirmed) {
			return;
		}
		const response = await fetch('/armies', {
			method: 'DELETE',
			body: JSON.stringify(army.id),
			headers: { 'Content-Type': 'application/json' }
		});
		const result = await response.json();
		if (result.errors) {
			errors = result.errors as FetchErrors;
			return;
		}
		if (response.status === 200) {
			goto(`/armies`);
		} else {
			errors = `${response.status} error`;
		}
	}
</script>

<svelte:head>
	<title>ClashArmies • Army • {army.name}</title>
</svelte:head>

<section class="banner">
	<img class="banner-img" src="/clash/banners/{army.banner}.png" alt="Clash of clans banner artwork" />
	<div class="banner-overlay"></div>
	<div class="banner-content">
		<div class="left">
			<div class="title-container">
				<img src="/clash/town-halls/{army.townHall}.png" alt="Town hall {army.townHall}" class="town-hall" />
				<h1>{army.name}</h1>
			</div>
			<p class="author">Assembled by <a href="/users/{army.username}">@{army.username}</a></p>
			<div class="tags">
				{#each getTags(army) as tag}
					<p>{tag}</p>
				{/each}
			</div>
		</div>
		<div class="right">
			<div class="totals">
				<small class="total">
					<img src="/clash/ui/troops.png" alt="Clash of clans troop capacity" />
					{housingSpaceUsed.troops}/{army.troopCapacity}
				</small>
				{#if army.spellCapacity > 0}
					<small class="total">
						<img src="/clash/ui/spells.png" alt="Clash of clans spell capacity" />
						{housingSpaceUsed.spells}/{army.spellCapacity}
					</small>
				{/if}
				{#if army.siegeCapacity > 0}
					<small class="total">
						<img src="/clash/ui/sieges.png" alt="Clash of clans siege machine capacity" />
						{housingSpaceUsed.sieges}/{army.siegeCapacity}
					</small>
				{/if}
				<small class="total">
					<img src="/clash/ui/clock.png" alt="Clash of clans clock (time to train army)" />
					{formatTime(housingSpaceUsed.time * 1000)}
				</small>
			</div>
			<div class="separator"></div>
			<C.Votes bind:votes bind:userVote armyId={army.id} allowEdit={app.user !== null} />
		</div>
	</div>
</section>

<section class="dashed units">
	<div class="top">
		<h2 class="dashed">Army units</h2>
		<ul class="units-list">
			{#each [...troopUnits, ...spellUnits, ...siegeUnits] as unit}
				<li>
					<C.UnitDisplay {...unit} />
				</li>
			{/each}
		</ul>
	</div>
	<div class="controls">
		<C.ActionButton ghost onclick={() => copyLink(units, app)} disabled={!units.length} title={getCopyBtnTitle(units)}>
			<svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path
					d="M3.4 3.4V0.849999C3.4 0.624565 3.48955 0.408365 3.64896 0.248959C3.80836 0.0895532 4.02456 0 4.25 0H14.45C14.6754 0 14.8916 0.0895532 15.051 0.248959C15.2104 0.408365 15.3 0.624565 15.3 0.849999V12.75C15.3 12.9754 15.2104 13.1916 15.051 13.351C14.8916 13.5104 14.6754 13.6 14.45 13.6H11.9V16.15C11.9 16.6192 11.5175 17 11.044 17H0.855949C0.743857 17.0007 0.632737 16.9792 0.528974 16.9368C0.42521 16.8944 0.330848 16.8319 0.25131 16.7529C0.171771 16.6739 0.108624 16.58 0.0654961 16.4765C0.0223682 16.373 0.000109968 16.2621 0 16.15L0.00255002 4.25C0.00255002 3.7808 0.38505 3.4 0.857649 3.4H3.4ZM1.7017 5.1L1.7 15.3H10.2V5.1H1.7017ZM5.1 3.4H11.9V11.9H13.6V1.7H5.1V3.4ZM3.4 7.64999H8.49999V9.34999H3.4V7.64999ZM3.4 11.05H8.49999V12.75H3.4V11.05Z"
					fill="black"
				/>
			</svg>
			Copy link
		</C.ActionButton>
		<C.ActionButton ghost onclick={() => openInGame(units)} disabled={!units.length} title={getOpenBtnTitle(units)}>
			<svg width="18" height="12" viewBox="0 0 18 12" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path
					fill-rule="evenodd"
					clip-rule="evenodd"
					d="M16.6241 5.45391C15.87 1.24228 14.184 0 13.2871 0C11.8875 0 11.5284 1.04051 8.54967 1.07556C5.57093 1.04051 5.21184 0 3.81224 0C2.91537 0 1.22849 1.24228 0.474403 5.45391C0.0443491 7.85811 -0.422469 11.4473 0.689858 11.8782C2.07407 12.4143 2.54345 11.0737 4.0636 9.94084C5.60684 8.7926 6.34725 8.52243 8.54967 8.52243C10.7521 8.52243 11.4925 8.7926 13.0357 9.94084C14.5559 11.0728 15.0253 12.4143 16.4095 11.8782C17.5218 11.4473 17.055 7.85896 16.6241 5.45391ZM5.12976 6.00024C4.67625 6.00024 4.24132 5.82008 3.92064 5.4994C3.59996 5.17872 3.4198 4.74379 3.4198 4.29028C3.4198 3.83677 3.59996 3.40184 3.92064 3.08116C4.24132 2.76048 4.67625 2.58033 5.12976 2.58033C5.58327 2.58033 6.0182 2.76048 6.33888 3.08116C6.65956 3.40184 6.83972 3.83677 6.83972 4.29028C6.83972 4.74379 6.65956 5.17872 6.33888 5.4994C6.0182 5.82008 5.58327 6.00024 5.12976 6.00024ZM11.1146 6.00024C10.8879 6.00024 10.6704 5.91016 10.51 5.74982C10.3497 5.58948 10.2596 5.37202 10.2596 5.14526C10.2596 4.91851 10.3497 4.70104 10.51 4.5407C10.6704 4.38036 10.8879 4.29028 11.1146 4.29028C11.3414 4.29028 11.5588 4.38036 11.7192 4.5407C11.8795 4.70104 11.9696 4.91851 11.9696 5.14526C11.9696 5.37202 11.8795 5.58948 11.7192 5.74982C11.5588 5.91016 11.3414 6.00024 11.1146 6.00024ZM12.8246 4.29028C12.5978 4.29028 12.3803 4.2002 12.22 4.03986C12.0597 3.87952 11.9696 3.66206 11.9696 3.4353C11.9696 3.20855 12.0597 2.99108 12.22 2.83074C12.3803 2.6704 12.5978 2.58033 12.8246 2.58033C13.0513 2.58033 13.2688 2.6704 13.4291 2.83074C13.5895 2.99108 13.6795 3.20855 13.6795 3.4353C13.6795 3.66206 13.5895 3.87952 13.4291 4.03986C13.2688 4.2002 13.0513 4.29028 12.8246 4.29028Z"
					fill="#53E059"
				/>
			</svg>
			Open in-game
		</C.ActionButton>
	</div>
</section>

{#if errors}
	<div class="errors">
		<C.Errors {errors} />
	</div>
{/if}

<div class="army-controls">
	{#if app.user && (app.user.id === army.createdBy || app.user.hasRoles('admin'))}
		<C.Button onclick={deleteArmy} theme="danger">Delete</C.Button>
		<C.Button asLink href="/armies/edit/{army.id}">Edit</C.Button>
	{/if}
</div>

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
		padding: 32px 24px;
		position: absolute;
		width: 100%;
		bottom: 0;
		left: 0;
	}

	.banner-content .left .title-container {
		display: flex;
		align-items: flex-end;
		gap: 0.5em;
	}
	.banner-content .left .town-hall {
		flex-shrink: 0;
		max-height: 60px;
		width: auto;
		/* Optical alignment */
		position: relative;
		bottom: 0.35em;
	}
	.banner-content .left h1 {
		color: var(--grey-100);
		max-width: 500px;
		word-break: break-all;
	}
	.banner-content .left .author,
	.banner-content .left .author a {
		font-size: var(--fs);
		line-height: var(--fs-lh);
	}
	.banner-content .left .author {
		margin-bottom: 12px;
		color: var(--grey-100);
		font-weight: 500;
	}
	.banner-content .left .author a {
		color: var(--primary-400);
		font-weight: 700;
	}
	.banner-content .left .tags {
		display: flex;
		gap: 6px;
	}
	.banner-content .left .tags p {
		text-transform: uppercase;
		background-color: #4c4538;
		color: #e0a553;
		font-size: 12px;
		line-height: 14px;
		font-weight: 700;
		border-radius: 4px;
		padding: 6px;
	}

	.banner-content .right,
	.banner-content .right .totals {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.banner-content .right .totals small {
		display: flex;
		align-items: center;
		font-family: 'Clash', sans-serif;
		color: var(--grey-100);
		font-size: 15px;
		gap: 4px;
	}
	.banner-content .right .totals img {
		display: block;
		max-height: 22px;
		height: 100%;
		width: auto;
	}
	.banner-content .right .separator {
		background-color: var(--grey-500);
		height: 22px;
		width: 1px;
	}

	/* DASHED SECTION */
	.dashed {
		background-color: var(--grey-800);
		border: 1px dashed var(--grey-500);
		border-radius: 8px;
	}

	/* UNITS */
	.units {
		--unit-size: 70px;
		margin-top: 48px;
	}
	.units .top {
		padding: 0 24px 24px 24px;
		margin-top: -12px;
	}
	.units .top h2 {
		display: inline-block;
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

	.units-list {
		display: flex;
		flex-flow: row wrap;
		padding: 0 8px;
		gap: 6px;
	}
	.units-list li {
		--unit-border-radius: 6px;
		--amount-size: 16px;
		width: var(--unit-size);
		height: var(--unit-size);
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
		margin-top: 24px;
	}

	/* ERRORS */
	.errors {
		margin-top: 24px;
	}

	@media (max-width: 850px) {
		.units {
			--unit-size: 60px;
			margin-top: 36px;
		}
		.units-list li {
			--amount-size: 14px;
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
	}

	@media (max-width: 775px) {
		.banner-content {
			flex-flow: column nowrap;
			align-items: flex-start;
			gap: 16px;
		}
	}

	@media (max-width: 650px) {
		.banner-img {
			max-height: none;
			height: 450px;
		}
	}

	@media (max-width: 600px) {
		.banner-content .left .title-container {
			flex-flow: column nowrap;
			align-items: flex-start;
		}
		.banner-content .left .town-hall {
			bottom: 0;
		}
	}

	@media (max-width: 550px) {
		.banner-content .right,
		.banner-content .right .totals {
			flex-flow: row wrap;
		}
		.banner-content .right .separator {
			display: none;
		}
		.units .top {
			padding: 0 16px 24px 16px;
		}
		.units .controls {
			padding: 16px 24px;
		}
		.banner-img {
			height: 550px;
		}
	}

	@media (max-width: 400px) {
		.units .controls {
			flex-flow: column nowrap;
		}
		.units-list li {
			--amount-size: 12px;
		}
	}
</style>
