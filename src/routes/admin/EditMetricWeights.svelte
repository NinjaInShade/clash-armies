<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { getContext } from 'svelte';
	import Button from '$components/Button.svelte';
	import Errors from '$components/Errors.svelte';
	import Fieldset from '$components/Fieldset.svelte';
	import Input from '$components/Input.svelte';
	import type { MetricWeights } from '$server/api/ArmyMetricsAPI';
	import { HTTPError, type APIErrors } from '$shared/http';
	import type { AppState } from '$types';

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
		<Fieldset label="Vote" htmlName="vote">
			<Input type="number" bind:value={draft.vote} disabled={!editing} />
		</Fieldset>
		<Fieldset label="Page view" htmlName="pageView">
			<Input type="number" bind:value={draft.pageView} disabled={!editing} />
		</Fieldset>
		<Fieldset label="Copy link click" htmlName="copyLinkClick">
			<Input type="number" bind:value={draft.copyLinkClick} disabled={!editing} />
		</Fieldset>
		<Fieldset label="Open link click" htmlName="openLinkClick">
			<Input type="number" bind:value={draft.openLinkClick} disabled={!editing} />
		</Fieldset>
	</div>

	<div class="errors-container">
		<Errors {errors} />
	</div>

	<div class="controls">
		{#if editing}
			<Button onClick={cancelEdit} disabled={saving}>Cancel</Button>
			<Button onClick={save} disabled={saveDisabled} theme="danger">Save</Button>
		{:else}
			<Button onClick={startEdit}>Edit</Button>
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
