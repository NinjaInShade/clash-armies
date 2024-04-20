<script lang="ts">
	import { getTotals, formatTime, copyLink, openInGame, getTags, getCopyBtnTitle, getOpenBtnTitle } from '~/lib/client/army';
	import type { Army } from '~/lib/shared/types';
	import C from '~/components';

	type Props = { army: Army };
	const { army } = $props<Props>();
	const { units } = $derived(army);

	let troopUnits = $derived(units.filter((item) => item.type === 'Troop'));
	let siegeUnits = $derived(units.filter((item) => item.type === 'Siege'));
	let spellUnits = $derived(units.filter((item) => item.type === 'Spell'));

	let votes = $state<number>(0);
	let userVote = $state<'upvoted' | 'downvoted' | null>(null);

	const housingSpaceUsed = $derived.call(() => getTotals(units));
</script>

<svelte:head>
	<title>ClashArmies • Army • {army.name}</title>
</svelte:head>

<section class="banner">
	<div class="container">
		<img src="/clash/banners/{army.banner}.png" alt="Clash of clans banner artwork" class="banner-img" />
		<div class="banner-overlay">
			<div>
				<h1>{army.name}</h1>
				<b>Assembled by <a href="/user/{army.username}">@{army.username}</a></b>
			</div>
			<div>
				<small class="total">
					<img src="/clash/ui/clock.png" alt="Clash of clans clock (time to train army)" />
					{formatTime(housingSpaceUsed.time * 1000)}
				</small>
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
				</div>
				<div class="tags">
					{#each getTags(army) as tag}
						<p>{tag}</p>
					{/each}
				</div>
			</div>
		</div>
	</div>
</section>

<section class="units">
	<div class="container">
		<h2>Units</h2>
		<ul class="units-grid">
			{#each [...troopUnits, ...spellUnits, ...siegeUnits] as unit}
				<li>
					<C.UnitDisplay {...unit} />
				</li>
			{/each}
		</ul>
	</div>
</section>

<section class="actions">
	<div class="container">
		<div class="left">
			<C.Button onclick={async () => copyLink(units)} disabled={!units.length} title={getCopyBtnTitle(units)}>Copy link</C.Button>
			<C.Button onclick={() => openInGame(units)} disabled={!units.length} title={getOpenBtnTitle(units)}>Open in-game</C.Button>
		</div>
		<div class="right">
			<C.Votes bind:votes bind:userVote />
		</div>
	</div>
</section>

<style>
	.banner {
		padding: 0 var(--side-padding);
	}

	.units {
		padding: 64px var(--side-padding) 50px var(--side-padding);
	}

	.banner .container {
		border-radius: 0.5em;
		overflow: hidden;
		position: relative;
		width: 100%;
	}

	.banner-img {
		display: block;
		object-fit: cover;
		aspect-ratio: 1920 / 800;
		max-height: 400px;
		height: 100%;
		width: 100%;
	}

	.banner-overlay {
		display: flex;
		flex-flow: column nowrap;
		justify-content: space-between;
		position: absolute;
		background-color: hsla(0, 0%, 0%, 0.6);
		padding: 40px 40px 32px 40px;
		max-width: 400px;
		height: 100%;
		left: 0;
		top: 0;
	}

	.banner-overlay h1 {
		color: var(--primary-400);
	}

	.banner-overlay b,
	.banner-overlay b a {
		font-size: var(--fs);
		line-height: var(--fs-lh);
		color: var(--grey-100);
		font-weight: 500;
	}

	.banner-overlay b {
		display: block;
		margin-top: 2px;
	}

	.totals {
		display: flex;
		align-items: center;
		margin-top: 12px;
		gap: 12px;
	}

	.total {
		display: flex;
		align-items: center;
		font-family: 'Clash', sans-serif;
		color: var(--grey-100);
		font-size: 1em;
	}

	.total img {
		display: block;
		max-height: 24px;
		margin-right: 8px;
		height: 100%;
		width: auto;
	}

	.tags {
		display: flex;
		align-items: flex-start;
		margin-top: 16px;
		gap: 6px;
	}

	.tags p {
		display: flex;
		align-items: center;
		background-color: var(--grey-500);
		color: var(--grey-100);
		font-size: var(--fs);
		font-weight: 700;
		padding: 8px 12px;
		border-radius: 50px;
		height: 32px;
		gap: 4px;
	}

	.units-grid {
		display: grid;
		grid-template-columns: repeat(14, 1fr);
		grid-template-rows: auto;
		font-size: 0.6em;
		margin-top: 8px;
		gap: 6px;
	}

	.actions {
		position: fixed;
		box-shadow: hsla(0, 0%, 30%, 0.4) 0px -20px 30px -10px;
		background-color: var(--grey-800);
		padding: 16px var(--side-padding);
		width: 100%;
		bottom: 0;
		left: 0;
	}

	.actions .container,
	.actions .left,
	.actions .right {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.actions .container {
		justify-content: space-between;
	}

	:global(body) {
		/* Must match .actions height */
		padding-bottom: 76px;
	}
</style>
