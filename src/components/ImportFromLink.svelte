<script lang="ts">
	import { getContext } from 'svelte';
	import type { AppState } from '$types';
	import { ArmyModel } from '$models';
	import { parseLink } from '$client/army';
	import Button from './Button.svelte';
	import Modal from './Modal.svelte';
	import Errors from './Errors.svelte';
	import Fieldset from './Fieldset.svelte';
	import Input from './Input.svelte';

	type Props = {
		/** Function that closes the modal */
		close: (importedModel?: ArmyModel) => void;
	};
	const { close }: Props = $props();
	const app = getContext<AppState>('app');

	let link = $state<string>('');
	let error = $state<string | null>(null);

	async function importUnits() {
		try {
			const importedModel = parseLink(link, app);
			if (!importedModel.units.length && !importedModel.ccUnits.length && !importedModel.equipment.length && !importedModel.pets.length) {
				error = "This import link didn't have any units - are you sure it's correct?";
				return;
			}
			close(importedModel);
		} catch (err: any) {
			error = err.message;
			return;
		}
	}
</script>

{#snippet controls()}
	<div class="controls">
		<Button onClick={() => close()}>Cancel</Button>
		<Button onClick={importUnits} disabled={!link.length}>Import</Button>
	</div>
{/snippet}

<Modal title="Import units from link" {close} {controls}>
	{#if error}
		<div class="errors-container">
			<Errors errors={error} />
		</div>
	{/if}

	<Fieldset label="Import link" htmlName="importLink" style="margin-bottom: 1em" --input-width="100%">
		<Input bind:value={link} name="importLink" placeholder="https://link.clashofclans.com/..." />
	</Fieldset>
</Modal>

<style>
	.errors-container {
		margin-bottom: 1em;
	}

	.controls {
		display: flex;
		justify-content: flex-end;
		width: 100%;
		gap: 0.5em;
	}
</style>
