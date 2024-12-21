<script lang="ts">
	import { getContext } from 'svelte';
	import type { PageData } from './$types';
	import THWidgetDisplay from './townhalls/THWidgetDisplay.svelte';
	import UnitTableDisplay from './units/UnitTableDisplay.svelte';
	import EditTownHall from './townhalls/EditTownHall.svelte';
	import EditUnit from './units/EditUnit.svelte';
	import { formatTime } from '$client/army';
	import type { Unit, TownHall, AppState } from '$types';
	import C from '$components';

	const { data }: { data: PageData } = $props();
	const { units, townHalls } = $derived(data);

	const app = getContext<AppState>('app');

	let selectedTHs = $state<number[]>([]);
	const thColumns = [
		{
			key: '',
			component: (row: TownHall) => {
				return [THWidgetDisplay, { level: row.level }];
			},
			width: '65px',
			cellStyle: 'justify-content: center; overflow-y: hidden',
		},
		{ key: 'level' },
		{ key: 'maxBarracks', label: 'Barracks' },
		{ key: 'maxDarkBarracks', label: 'D barracks' },
		{ key: 'maxSpellFactory', label: 'S factory' },
		{ key: 'maxDarkSpellFactory', label: 'D S factory' },
		{ key: 'maxLaboratory', label: 'Lab', width: '60px' },
		{ key: 'maxWorkshop', label: 'Workshop', width: '110px' },
		{ key: 'troopCapacity', label: 'Troops', width: '85px' },
		{ key: 'siegeCapacity', label: 'Sieges', width: '85px' },
		{ key: 'spellCapacity', label: 'Spells', width: '80px' },
	];

	let selectedUnits = $state<number[]>([]);
	const unitColumns = [
		{
			key: '',
			component: (row: Unit) => {
				return [UnitTableDisplay, { name: row.name }];
			},
			width: '65px',
			cellStyle: 'justify-content: center; overflow-y: hidden',
		},
		{ key: 'type', label: 'Type', width: '100px' },
		{ key: 'name', label: 'Name' },
		{ key: 'objectId', label: 'Object ID', width: '120px' },
		{ key: 'trainingTime', label: 'Training time', render: (row: Unit) => formatTime(row.trainingTime * 1000), width: '165px' },
		{ key: 'housingSpace', label: 'Housing space', width: '165px' },
		{
			key: 'maxLevel',
			label: 'Max level',
			width: '105px',
			render: (row: Unit) => {
				const levels = row.levels.map((lvl) => lvl.level);
				return Math.max(...levels);
			},
		},
	];

	function addTownHall() {
		app.openModal(EditTownHall);
	}

	function editTownHall() {
		const selected = selectedTHs[0];
		if (!selected) return;
		app.openModal(EditTownHall, { townHall: townHalls.find((th) => th.level === selected) });
	}

	function addUnit() {
		app.openModal(EditUnit);
	}

	function editUnit() {
		const selected = selectedUnits[0];
		if (!selected) return;
		app.openModal(EditUnit, { unit: units.find((th) => th.id === selected) });
	}
</script>

<svelte:head>
	<title>ClashArmies • Admin panel</title>
</svelte:head>

<header>
	<div class="container">
		<h1 class="title">
			<svg width="44" height="44" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path
					d="M52 30.5882H45.3318C44.8118 32.7294 43.9859 34.7176 42.8541 36.4918L47.5647 41.2024L41.1412 47.6259L36.4306 42.9153C34.6565 44.0165 32.6682 44.8424 30.5882 45.3318V52H21.4118V45.3318C19.3318 44.8424 17.3435 44.0165 15.5694 42.9153L10.8588 47.6259L4.37412 41.1412L9.08471 36.4306C7.98353 34.6565 7.15765 32.6682 6.66824 30.5882H0V21.5035H6.63765C7.12706 19.3624 7.98353 17.3741 9.08471 15.5694L4.37412 10.8588L10.7976 4.43529L15.5082 9.14588C17.2824 8.01412 19.3012 7.18823 21.4118 6.66823V0H30.5882V6.66823C32.6682 7.15765 34.6565 7.98353 36.4306 9.08471L41.1412 4.37412L47.6259 10.8588L42.9153 15.5694C44.0165 17.3741 44.8729 19.3624 45.3624 21.5035H52V30.5882ZM26 35.1765C31.0776 35.1765 35.1765 31.0776 35.1765 26C35.1765 20.9224 31.0776 16.8235 26 16.8235C20.9224 16.8235 16.8235 20.9224 16.8235 26C16.8235 31.0776 20.9224 35.1765 26 35.1765Z"
					fill="var(--grey-100)"
				/>
			</svg>
			Admin Panel
		</h1>
		<p class="body subtitle">Manage settings, data and more</p>
	</div>
</header>

<section class="town-halls">
	<div class="container">
		<div class="table-above">
			<div>
				<h2>Town halls</h2>
				<p class="body">Add & edit town hall data</p>
			</div>
			<div class="actions">
				<C.Button class="btn btn-sm" onClick={addTownHall}>Add</C.Button>
				<C.Button class="btn btn-sm" onClick={editTownHall} disabled={!selectedTHs.length}>Edit</C.Button>
			</div>
		</div>
		<C.Table data={townHalls} columns={thColumns} bind:selectedKeys={selectedTHs} defaultSortKey="level" selectable />
	</div>
</section>

<section class="units">
	<div class="container">
		<div class="table-above">
			<div>
				<h2>Units</h2>
				<p class="body">Add & edit unit data</p>
			</div>
			<div class="actions">
				<C.Button class="btn btn-sm" onClick={addUnit}>Add</C.Button>
				<C.Button class="btn btn-sm" onClick={editUnit} disabled={!selectedUnits.length}>Edit</C.Button>
			</div>
		</div>
		<C.Table data={units} columns={unitColumns} bind:selectedKeys={selectedUnits} defaultSortKey="type" selectable />
	</div>
</section>

<style>
	header {
		padding: 50px var(--side-padding) 0 var(--side-padding);
	}

	header .container {
		border-bottom: 1px solid var(--grey-500);
		padding-bottom: 16px;
	}

	.title {
		display: flex;
		align-items: center;
		color: var(--grey-100);
		line-height: var(--h1);
		font-weight: 400;
		gap: 0.3em;
	}

	.title svg {
		flex-shrink: 0;
		position: relative;
		bottom: 4px;
	}

	.subtitle {
		margin-top: 10px;
	}

	.table-above {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		margin-bottom: 1em;
		gap: 0.5em;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	h2 {
		color: var(--primary-400);
	}

	h2 + p {
		margin-top: 0.5em;
	}

	.town-halls {
		padding: 50px var(--side-padding);
	}

	.units {
		padding: 0 var(--side-padding) 50px var(--side-padding);
	}
</style>
