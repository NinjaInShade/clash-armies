<script lang="ts">
	import { getContext } from 'svelte';
	import type { AppState, Unit, Units, HousingSpace } from '~/lib/types';
	import { ARMY_EDIT_FILLER, HOLD_ADD_SPEED, HOLD_REMOVE_SPEED, SECOND, MINUTE, HOUR } from '~/lib/constants';
	import { getLevel, generateLink, openLink } from '~/lib/army';
	import Alert from './Alert.svelte';
	import UnitDisplay from './UnitDisplay.svelte';
	import Button from './Button.svelte';

	type Entries<T> = {
		[K in keyof T]: [K, T[K]];
	}[keyof T][];
	const getEntries = <T extends object>(obj: T) => Object.entries(obj) as Entries<T>;
	type TitleOptions = {
		level: number;
		type: Unit['type'];
		reachedMaxAmount: boolean;
		reachedSuperLimit?: boolean;
	};
	type UnitWithoutAmount = Omit<Unit, 'amount'>;
	type Totals = HousingSpace & { time: number };

	const app = getContext<AppState>('app');

	let units = $state<Units>([]);
	let troopUnits = $derived(units.filter((item) => item.type === 'Troop'));
	let siegeUnits = $derived(units.filter((item) => item.type === 'Siege'));
	let spellUnits = $derived(units.filter((item) => item.type === 'Spell'));

	/** Army units but in guaranteed order of troops, siege and spells */
	let orderedUnits = $derived([...troopUnits, ...siegeUnits, ...spellUnits]);

	let reachedSuperLimit = $derived(troopUnits.filter((t) => t.data[1].isSuper).length === 2);

	let maxHousingSpace: HousingSpace = { troops: 320, spells: 11, sieges: 1 }; // TODO: calculate dynamically
	let housingSpaceUsed = $derived.call(getSelectedTotals);

	let holdAddInterval: ReturnType<typeof setInterval> | null = null;
	let holdRemoveInterval: ReturnType<typeof setInterval> | null = null;

	function add(unit: UnitWithoutAmount, arr = units) {
		const existing = arr.find((item) => item.name === unit.name);
		if (existing) {
			existing.amount += 1;
		} else {
			arr.push({ ...unit, amount: 1 });
		}
		return arr;
	}

	function remove(name: Unit['name']) {
		const existingIndex = units.findIndex((item) => item.name === name);
		if (units[existingIndex].amount === 1) {
			units.splice(existingIndex, 1);
		} else {
			units[existingIndex].amount -= 1;
		}
	}

	function initHoldAdd(unit: UnitWithoutAmount) {
		if (willOverflowHousingSpace(unit)) {
			return;
		}
		// add straight away in case user clicked
		add(unit);
		holdAddInterval = setInterval(() => {
			// if no more housing space  don't try adding & stop
			if (willOverflowHousingSpace(unit)) {
				stopHoldAdd();
				return;
			}
			add(unit);
		}, HOLD_ADD_SPEED);
	}

	function initHoldRemove(name: Unit['name']) {
		// remove straight away in case user clicked
		remove(name);
		// if we removed the last troop/spell stop removing
		const exists = units.find((item) => item.name === name);
		if (!exists) {
			stopHoldRemove();
			return;
		}
		holdRemoveInterval = setInterval(() => {
			remove(name);
			// if we removed the last troop/spell stop removing
			const exists = units.find((item) => item.name === name);
			if (!exists) {
				stopHoldRemove();
			}
		}, HOLD_REMOVE_SPEED);
	}

	function stopHoldAdd() {
		if (!holdAddInterval) return;
		clearInterval(holdAddInterval);
		holdAddInterval = null;
	}

	function stopHoldRemove() {
		if (!holdRemoveInterval) return;
		clearInterval(holdRemoveInterval);
		holdRemoveInterval = null;
	}

	async function copyLink() {
		const link = generateLink(units);
		await navigator.clipboard.writeText(link);
		alert(`Successfully copied "${link}" to clipboard!`);
		// TODO: change to a toast notification
	}

	function openInGame() {
		const link = generateLink(units);
		openLink(link);
	}

	/**
	 * @param time: the time to format in miliseconds
	 * @returns formatted time string e.g. '1m 20s'
	 */
	function formatTime(time: number) {
		let parts: string[] = [];

		if (time >= HOUR) {
			const hours = Math.floor(time / HOUR);
			parts.push(`${hours}h`);
			time -= hours * HOUR;
		}
		if (time >= MINUTE) {
			const mins = Math.floor(time / MINUTE);
			parts.push(`${mins}m`);
			time -= mins * MINUTE;
		}
		if (time >= SECOND) {
			const secs = Math.floor(time / SECOND);
			parts.push(`${secs}s`);
			time -= secs * SECOND;
		}
		if (time > 0) {
			throw new Error(`Unexpected time left over after formatting: "${time}"`);
		}

		return parts.length ? parts.join(' ') : '0s';
	}

	function getSelectedTotals(arr = units) {
		if (!arr.length) {
			return { troops: 0, sieges: 0, spells: 0, time: 0 };
		}
		// These types can train at the same time.
		// The total time to train then is the max out of them all.
		const ParallelTimeCount = {
			troops: 0,
			spells: 0,
			sieges: 0
		};
		return arr.reduce<Totals>(
			(prev, curr) => {
				const data = Object.values<Unit['data'][number]>(curr.data);
				const housingSpace = data[data.length - 1].housingSpace;
				const trainingTime = data[data.length - 1].trainingTime;
				const key = curr.type.toLowerCase() + 's';

				ParallelTimeCount[key] += trainingTime * curr.amount;
				prev[key] += housingSpace * curr.amount;
				prev.time = Math.max(...Object.values(ParallelTimeCount));

				return prev;
			},
			{ troops: 0, sieges: 0, spells: 0, time: 0 }
		);
	}

	function willOverflowHousingSpace(unit: UnitWithoutAmount) {
		const selectedCopy: Units = JSON.parse(JSON.stringify(units));
		const selectedPreview = add(unit, selectedCopy);
		const { troops, sieges, spells } = getSelectedTotals(selectedPreview);
		return troops > maxHousingSpace.troops || sieges > maxHousingSpace.sieges || spells > maxHousingSpace.spells;
	}

	function getCardTitle(opts: TitleOptions) {
		const { level, type, reachedMaxAmount, reachedSuperLimit } = opts;
		if (level === -1) {
			return `You do not have this ${type.toLowerCase()} unlocked warrior!`;
		}
		if (reachedMaxAmount) {
			return `There is no space left to house this ${type.toLowerCase()} warrior!`;
		}
		if (reachedSuperLimit) {
			return 'You have reached the max two super troops per army limit warrior!';
		}
		return undefined;
	}
</script>

<svelte:head>
	<title>ClashArmies • Create Army</title>
</svelte:head>

<svelte:window
	onmouseup={() => {
		// handle this on window in case user mouses cursor from the card then does mouseup
		stopHoldAdd();
		stopHoldRemove();
	}}
/>

<!-- <div class="alert">
	<div class="container">
		<Alert>
			Clan castle troops/spells, pets, heroes and hero equipment must be manually edited in game after opening the army via the generated link. Hopefully one
			day Supercell allows this!
		</Alert>
	</div>
</div> -->

<section class="units">
	<div class="container">
		<h2 class="heading"><span>1</span> Units</h2>
		{@render unitsSelected()}
		{@render unitsPicker('Troop')}
		{@render unitsPicker('Siege')}
		{@render unitsPicker('Spell')}
	</div>
</section>

<section class="actions">
	<div class="container">
		<div class="left">
			<small class="total">
				<img src="/clash/ui/troops.png" alt="Clash of clans troop capacity" />
				{housingSpaceUsed.troops} / {maxHousingSpace.troops}
			</small>
			<small class="total">
				<img src="/clash/ui/spells.png" alt="Clash of clans spell capacity" />
				{housingSpaceUsed.spells} / {maxHousingSpace.spells}
			</small>
			<small class="total">
				<img src="/clash/ui/sieges.png" alt="Clash of clans siege machine capacity" />
				{housingSpaceUsed.sieges} / {maxHousingSpace.sieges}
			</small>
			<small class="total">
				<img src="/clash/ui/clock.png" alt="Clash of clans clock (time to train army)" />
				{formatTime(housingSpaceUsed.time * 1000)}
			</small>
		</div>
		<div class="right">
			<Button
				onclick={copyLink}
				disabled={!units.length}
				title={!units.length
					? 'Army cannot be shared when empty'
					: "Copies an army link to your clipboard for sharing.\nNote: may not work if the army isn't at full capacity"}
			>
				Share
			</Button>
			<Button
				onclick={openInGame}
				disabled={!units.length}
				title={!units.length
					? 'Army cannot be opened in-game when empty'
					: "Opens clash of clans and allows you to paste your army in one of your slots.\nNote: may not work if the army isn't at full capacity"}
			>
				Open in-game
			</Button>
			<Button onclick={openSave} disabled={!units.length}>Create</Button>
		</div>
	</div>
</section>

{#snippet unitsSelected()}
	<ul class="grid">
		{#each orderedUnits as unit}
			<li>
				<button
					class="object-card"
					onmousedown={() => initHoldRemove(unit.name)}
					onmouseleave={() => stopHoldRemove()}
					onkeypress={(ev) => {
						if (ev.key !== 'Enter') {
							return;
						}
						remove(unit.name);
					}}
				>
					<UnitDisplay {...unit} />
				</button>
			</li>
		{/each}
		{@render filler()}
	</ul>
{/snippet}

{#snippet unitsPicker(type: 'Troop' | 'Siege' | 'Spell')}
	<!-- I have to admit, messing around with the type param like this isn't the prettiest thing, but I'm more comfortable with the logic being defined in one place :^ -->
	{@const entries = type === 'Troop' ? getEntries(app.troops) : type === 'Siege' ? getEntries(app.sieges) : getEntries(app.spells)}
	{@const heading = `Select ${type === 'Troop' ? 'troops' : type === 'Siege' ? 'siege machine' : 'spells'}`}
	<h3>{heading}</h3>
	<ul class="picker-grid">
		{#each entries as [name, data]}
			{@const unit = { type, name, data }}
			{@const level = getLevel(unit, app)}
			{@const reachedMaxAmount = willOverflowHousingSpace(unit)}
			<!-- Disable if reached max unique super limit of 2 and this troop isn't one already selected -->
			<!-- TOOD: fix data[1].isSuper, properties like isSuper that apply to all levels should not live in level data -->
			{@const disableSuper = type === 'Troop' && data[1].isSuper && !units.find((item) => item.name === unit.name) && reachedSuperLimit}
			{@const title = getCardTitle({ level, type, reachedMaxAmount, reachedSuperLimit: disableSuper })}
			<li>
				<button
					class="picker-card"
					disabled={reachedMaxAmount || level === -1 || disableSuper}
					onmousedown={() => initHoldAdd(unit)}
					onmouseleave={() => stopHoldAdd()}
					onkeypress={(ev) => {
						if (ev.key !== 'Enter') {
							return;
						}
						add(unit);
					}}
				>
					<UnitDisplay {...unit} {level} {title} />
				</button>
			</li>
		{/each}
	</ul>
{/snippet}

{#snippet filler()}
	{@const amount = ARMY_EDIT_FILLER}
	{@const length = amount - units.length > 0 ? amount - units.length : 0}
	{#each Array.from({ length }) as _}
		<li class="object-card" />
	{/each}
{/snippet}

<style>
	.total {
		display: flex;
		align-items: center;
		background-color: var(--grey-900);
		font-family: 'Clash', sans-serif;
		color: var(--grey-100);
		border-radius: 6px;
		padding-right: 8px;
		font-size: 0.85em;
		height: 26px;
	}
	.total img {
		max-height: 32px;
		margin-left: -12px;
		margin-right: 16px;
		height: 100%;
		width: auto;
	}

	.alert {
		padding: 50px var(--side-padding) 0 var(--side-padding);
	}

	.units {
		padding: 50px var(--side-padding);
	}

	.extras .container {
		border: 1px dashed var(--grey-500);
		padding: 32px;
	}

	:global(body) {
		/* Must match .actions height */
		margin-bottom: 76px;
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
		gap: 1em;
	}

	.actions .left {
		padding-left: 12px;
		gap: 1.5em;
	}

	.actions .container {
		justify-content: space-between;
	}

	.heading,
	.heading span {
		font-size: var(--heading);
		line-height: var(--heading-lh);
	}

	.heading {
		display: flex;
		align-items: center;
		margin-bottom: 24px;
		gap: 16px;
	}

	.heading span {
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--primary-400);
		color: var(--grey-100);
		border-radius: 50%;
		height: 40px;
		width: 40px;
	}

	.grid,
	.picker-grid {
		display: grid;
		grid-template-columns: repeat(10, 1fr);
		grid-template-rows: auto;
		gap: 8px;
	}

	.picker-grid {
		grid-template-columns: repeat(18, 1fr);
	}

	.picker-grid li {
		width: 100%;
	}

	.object-card,
	.picker-card {
		display: flex;
		justify-content: center;
		align-items: center;
		overflow: hidden;
		border-radius: 6px;
		width: 100%;
	}

	.object-card {
		border: 1px dashed var(--grey-500);
		height: 125px;
	}

	.picker-card {
		transition: none;
		max-height: 60px;
		height: 100%;
	}

	.picker-card:disabled {
		cursor: not-allowed;
		filter: grayscale(1);
		opacity: 0.5;
	}

	.object-card .add-icon {
		transition: opacity 0.15s ease-in-out;
		opacity: 0;
	}

	.object-card:hover .add-icon,
	.object-card:focus .add-icon {
		opacity: 1;
	}

	h3 {
		margin: 24px 0 16px 0;
		font-weight: 400;
	}
</style>
