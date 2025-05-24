<script lang="ts">
	import type { PageData } from './$types';
	import THWidgetDisplay from '$components/THWidgetDisplay.svelte';
	import UnitTableDisplay from '$components/UnitTableDisplay.svelte';
	import type { Unit, TownHall } from '$types';
	import C from '$components';

	const { data }: { data: PageData } = $props();
	const { serverStats, units, townHalls } = $derived(data);

	$inspect('Server stat', serverStats);

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

<svelte:head>
	<title>ClashArmies • Admin panel</title>
	<!-- Note: this route shouldn't be indexable so no point in meta:description/canonical tags -->
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

<main>
	<section class="stats">
		<div class="container">
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
		</div>
	</section>

	<section class="town-halls">
		<div class="container">
			<div class="table-above">
				<div>
					<h2>Town halls ({townHalls.length})</h2>
					<p class="body">Town hall data</p>
				</div>
				<div class="actions"></div>
			</div>
			<div class="table-container">
				<C.Table data={townHalls} columns={thColumns} bind:selectedKeys={selectedTHs} defaultSortKey="level" selectable />
			</div>
		</div>
	</section>

	<section class="units">
		<div class="container">
			<div class="table-above">
				<div>
					<h2>Units ({units.length})</h2>
					<p class="body">Unit data</p>
				</div>
				<div class="actions"></div>
			</div>
			<div class="table-container">
				<C.Table data={units} columns={unitColumns} bind:selectedKeys={selectedUnits} defaultSortKey="type" selectable />
			</div>
		</div>
	</section>
</main>

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

	h2 {
		color: var(--primary-400);
	}

	h2 + p {
		margin-top: 0.15em;
	}

	main {
		> section {
			padding: 0 var(--side-padding) 24px var(--side-padding);

			&:first-child {
				padding-top: 24px;
			}

			&:last-child {
				padding-bottom: 50px;
			}
		}
	}
</style>
