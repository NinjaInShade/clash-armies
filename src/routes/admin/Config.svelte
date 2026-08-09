<script lang="ts">
	import EditMetricWeights from './EditMetricWeights.svelte';

	type Props = {
		metricWeights: {
			vote: number;
			pageView: number;
			copyLinkClick: number;
			openLinkClick: number;
		};
	};
	const { metricWeights }: Props = $props();
</script>

<section class="metric-weights">
	<div class="table-above">
		<div>
			<h2>Metric weights</h2>
			<p class="body">Each multiplies its metric before summing into an army's ranking score</p>
		</div>
		<div class="actions"></div>
	</div>
	<EditMetricWeights weights={metricWeights} />
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
</style>
