<script lang="ts">
	import { getContext } from 'svelte';
	import type { AppState } from '$types';
	import { HTTPError, type APIErrors } from '$shared/http';
	import { invalidateAll } from '$app/navigation';
	import type { MetricWeights } from '$server/api/ArmyMetricsAPI';
	import C from '$components';

	type Props = {
		/** Current weights */
		weights: MetricWeights;
	};
	const { weights }: Props = $props();

	const app = getContext<AppState>('app');

	let draft = $state<Record<keyof MetricWeights, number | null>>(structuredClone(weights));

	let errors = $state<APIErrors | null>(null);
	let editing = $state(false);
	let saving = $state(false);

	const saveDisabled = $derived(saving || Object.values(draft).some((weight) => typeof weight !== 'number'));

	function startEdit() {
		draft = structuredClone(weights);
		errors = null;
		editing = true;
	}

	function cancelEdit() {
		draft = structuredClone(weights);
		errors = null;
		editing = false;
	}

	async function save() {
		const confirmed = await app.confirm('Are you sure you want to update to these weights?');
		if (!confirmed) {
			return;
		}

		saving = true;
		try {
			await app.http.post('/api/metrics/weights', draft);
			errors = null;
		} catch (err: unknown) {
			if (err instanceof HTTPError) {
				errors = err.errors ?? err.message;
			}
			return;
		} finally {
			saving = false;
		}

		editing = false;
		await invalidateAll();
	}
</script>

<div class="edit-metric-weights">
	<div class="fields">
		<C.Fieldset label="Vote" htmlName="vote">
			<C.Input type="number" bind:value={draft.vote} disabled={!editing} />
		</C.Fieldset>
		<C.Fieldset label="Page view" htmlName="pageView">
			<C.Input type="number" bind:value={draft.pageView} disabled={!editing} />
		</C.Fieldset>
		<C.Fieldset label="Copy link click" htmlName="copyLinkClick">
			<C.Input type="number" bind:value={draft.copyLinkClick} disabled={!editing} />
		</C.Fieldset>
		<C.Fieldset label="Open link click" htmlName="openLinkClick">
			<C.Input type="number" bind:value={draft.openLinkClick} disabled={!editing} />
		</C.Fieldset>
	</div>

	<div class="errors-container">
		<C.Errors {errors} />
	</div>

	<div class="controls">
		{#if editing}
			<C.Button onClick={cancelEdit} disabled={saving}>Cancel</C.Button>
			<C.Button onClick={save} disabled={saveDisabled} theme="danger">Save</C.Button>
		{:else}
			<C.Button onClick={startEdit}>Edit</C.Button>
		{/if}
	</div>
</div>

<style>
	.fields {
		display: flex;
		flex-flow: row wrap;
		gap: 1em;
	}

	.errors-container:not(:empty) {
		padding: 0 1.5em 1.5em 1.5em;
	}

	.controls {
		display: flex;
		justify-content: flex-end;
		border-top: 1px solid var(--grey-700);
		padding: 1em 1.5em;
		gap: 0.5em;
	}

	.edit-metric-weights {
		background-color: var(--grey-900);
		border-radius: 8px;

		/* Hide the number input step controls */
		* :global(input[type='number']) {
			appearance: textfield;
		}

		& .fields {
			display: grid;
			grid-template-columns: repeat(2, 1fr);
			padding: 1.5em;
			--input-width: 100%;

			@media (max-width: 450px) {
				grid-template-columns: 1fr;
			}
		}
	}
</style>
