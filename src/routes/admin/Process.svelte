<script lang="ts">
	import type { ProcessStats } from './+page.server';

	type Props = {
		processStats: ProcessStats;
	};
	const { processStats }: Props = $props();
</script>

<section class="stats">
	<div class="table-above">
		<div>
			<h2>Process</h2>
			<p class="body">Running process stats</p>
		</div>
		<div class="actions"></div>
	</div>
	<div class="stats-grid">
		<div class="stats-card">
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
				<path
					fill="currentColor"
					d="M232 56H24A16 16 0 0 0 8 72v128a8 8 0 0 0 16 0v-16h16v16a8 8 0 0 0 16 0v-16h16v16a8 8 0 0 0 16 0v-16h16v16a8 8 0 0 0 16 0v-16h16v16a8 8 0 0 0 16 0v-16h16v16a8 8 0 0 0 16 0v-16h16v16a8 8 0 0 0 16 0v-16h16v16a8 8 0 0 0 16 0V72a16 16 0 0 0-16-16m-24 40v48h-64V96Zm-96 0v48H48V96Z"
				/>
			</svg>
			<h3>RAM usage (RSS)</h3>
			<b>{processStats.rss} MB</b>
		</div>
		<div class="stats-card">
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
				<path
					fill="currentColor"
					d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"
				/>
			</svg>
			<h3>Uptime</h3>
			<b>{processStats.uptime}</b>
		</div>
		<div class="stats-card">
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
				<path fill="currentColor" d="M9.4 16.6 4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0 4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />
			</svg>
			<h3>Node version</h3>
			<b>{processStats.nodeVersion}</b>
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
