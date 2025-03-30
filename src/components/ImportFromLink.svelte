<script lang="ts">
	import { getContext } from 'svelte';
	import type { AppState, Optional, ArmyUnit } from '$types';
	import { validateUnits } from '$shared/validation';
	import { parseLink } from '$client/army';
	import Button from './Button.svelte';
	import Modal from './Modal.svelte';
	import Errors from './Errors.svelte';
	import Fieldset from './Fieldset.svelte';
	import Input from './Input.svelte';

	type Props = {
		/** Function that closes the modal */
		close: (units?: Optional<ArmyUnit, 'id'>[]) => void;
		selectedUnits: Optional<ArmyUnit, 'id'>[];
		selectedTownHall: number;
	};
	const { close, selectedUnits, selectedTownHall }: Props = $props();
	const app = getContext<AppState>('app');

	let link = $state<string>('');
	let error = $state<string | null>(null);

	async function importUnits() {
		let importedUnits: Optional<ArmyUnit, 'id'>[] = [];
		try {
			importedUnits = parseLink(link, { units: app.units });
		} catch (err: unknown) {
			error = err.message;
			return;
		}
		if (!importedUnits.length) {
			error = "This import link didn't have any units - are you sure it's correct?";
			return;
		}
		try {
			validateUnits(importedUnits, selectedTownHall, { units: app.units, townHalls: app.townHalls });
		} catch (err: unknown) {
			error = err.message;
			return;
		}
		if (selectedUnits.length) {
			const confirmed = await app.confirm('Importing these units will clear existing ones. Import anyway?');
			if (!confirmed) return;
		}
		close(importedUnits);
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
