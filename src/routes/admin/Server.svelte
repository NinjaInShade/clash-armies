<script lang="ts">
	import type { ServerStats } from './+page.server';

	type Props = {
		serverStats: ServerStats;
	};
	const { serverStats }: Props = $props();
</script>

<section class="stats">
	<div class="table-above">
		<div>
			<h2>Server</h2>
			<p class="body">Physical server stats</p>
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

<style>
	section {
		padding-bottom: 50px;
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
