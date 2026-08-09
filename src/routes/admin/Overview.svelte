<script lang="ts">
	import THWidgetDisplay from '$components/THWidgetDisplay.svelte';
	import UnitTableDisplay from '$components/UnitTableDisplay.svelte';
	import Table from '$components/Table.svelte';
	import type { Unit, TownHall } from '$types';
	import type { ServerStats, AppStats } from './+page.server';

	type Props = {
		serverStats: ServerStats;
		appStats: AppStats;
		units: Unit[];
		townHalls: TownHall[];
	};
	const { serverStats, appStats, units, townHalls }: Props = $props();

	const armiesByTHColumns = [
		{
			key: '',
			component: (row: { townHall: number; count: number }) => {
				return [THWidgetDisplay, { level: row.townHall }];
			},
			width: '65px',
			cellStyle: 'justify-content: center; overflow-y: hidden',
		},
		{ key: 'townHall', label: 'Town Hall', width: '120px' },
		{ key: 'count', label: 'Armies' },
	];

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
		{ key: 'clashId', label: 'Clash ID', width: '120px' },
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
</script>

<section class="stats">
	<div class="table-above">
		<div>
			<h2>Server</h2>
			<p class="body">Server/system stats</p>
		</div>
		<div class="actions"></div>
	</div>
	<div class="stats-grid">
		<div class="stats-card">
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36">
				<path fill="currentColor" d="M30.86 8.43A2 2 0 0 0 28.94 7H7.06a2 2 0 0 0-1.93 1.47L2.29 20h31.42Z" class="clr-i-solid clr-i-solid-path-1" />
				<path fill="currentColor" d="M2 22v7a2 2 0 0 0 2 2h28a2 2 0 0 0 2-2v-7Zm28 5h-4v-2h4Z" class="clr-i-solid clr-i-solid-path-2" />
				<path fill="none" d="M0 0h36v36H0z" />
			</svg>
			<h3>Disk usage</h3>
			<b>{serverStats.usedDisk}/{serverStats.totalDisk} GB</b>
		</div>
		<div class="stats-card">
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
				<path
					fill="currentColor"
					d="M232 56H24A16 16 0 0 0 8 72v128a8 8 0 0 0 16 0v-16h16v16a8 8 0 0 0 16 0v-16h16v16a8 8 0 0 0 16 0v-16h16v16a8 8 0 0 0 16 0v-16h16v16a8 8 0 0 0 16 0v-16h16v16a8 8 0 0 0 16 0v-16h16v16a8 8 0 0 0 16 0v-16h16v16a8 8 0 0 0 16 0V72a16 16 0 0 0-16-16m-24 40v48h-64V96Zm-96 0v48H48V96Z"
				/>
			</svg>
			<h3>RAM usage</h3>
			<b>{serverStats.usedMemory}/{serverStats.totalMemory} GB</b>
		</div>
	</div>
</section>

<section class="stats">
	<div class="table-above">
		<div>
			<h2>App</h2>
			<p class="body">Application stats</p>
		</div>
		<div class="actions"></div>
	</div>
	<div class="stats-grid">
		<div class="stats-card">
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
				<path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
			</svg>
			<h3>Users</h3>
			<b>{appStats.totalUsers}</b>
		</div>
		<div class="stats-card">
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
				<path fill="currentColor" d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z" />
			</svg>
			<h3>Armies</h3>
			<b>{appStats.totalArmies}</b>
		</div>
		<div class="stats-card">
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
				<path fill="currentColor" d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z" />
			</svg>
			<h3>Comments</h3>
			<b>{appStats.totalComments}</b>
		</div>
	</div>
</section>

<section class="armies-by-th">
	<div class="table-above">
		<div>
			<h2>Armies by Town Hall</h2>
			<p class="body">Army count per town hall level</p>
		</div>
		<div class="actions"></div>
	</div>
	<div class="table-container">
		<Table data={appStats.armiesByTownHall} columns={armiesByTHColumns} defaultSortKey="townHall" selectable />
	</div>
</section>

<section class="town-halls">
	<div class="table-above">
		<div>
			<h2>Town halls ({townHalls.length})</h2>
			<p class="body">Town hall data</p>
		</div>
		<div class="actions"></div>
	</div>
	<div class="table-container">
		<Table data={townHalls} columns={thColumns} bind:selectedKeys={selectedTHs} defaultSortKey="level" selectable />
	</div>
</section>

<section class="units">
	<div class="table-above">
		<div>
			<h2>Units ({units.length})</h2>
			<p class="body">Unit data</p>
		</div>
		<div class="actions"></div>
	</div>
	<div class="table-container">
		<Table data={units} columns={unitColumns} bind:selectedKeys={selectedUnits} defaultSortKey="type" selectable />
	</div>
</section>

<style>
	section {
		padding-bottom: 24px;

		&:last-of-type {
			padding-bottom: 50px;
		}
	}

	.table-above {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		margin-bottom: 1em;
		gap: 0.5em;

		& h2 {
			color: var(--primary-400);

			+ p {
				margin-top: 0.15em;
			}
		}
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.table-container {
		display: flex;
		max-height: 600px;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		grid-auto-rows: 1fr;
		height: 100%;
		width: 100%;
		gap: 1.5em;

		& .stats-card {
			display: flex;
			flex-flow: column nowrap;
			justify-content: center;
			align-items: center;
			position: relative;
			overflow: hidden;
			background-color: var(--grey-900);
			border-radius: 8px;
			padding: 1em;
			width: 100%;

			& svg {
				color: var(--grey-400);
				width: 2.5em;
				height: 2.5em;
			}

			& h3 {
				color: var(--grey-400);
				text-transform: uppercase;
				margin: 0.25em 0;
				text-align: center;
				font-weight: 400;
			}

			& b {
				display: block;
				text-align: center;
				font-size: var(--fs-md);
				line-height: var(--fs-md-lh);
				color: var(--grey-100);
			}
		}
	}
</style>
