<script lang="ts">
	import { getContext } from 'svelte';
	import type { AppState, Optional, ArmyUnit } from '$types';
	import { validateUnits } from '$shared/validation';
	import { parseLink } from '$client/army';
	import C from '$components';

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
		<C.Button onClick={() => close()}>Cancel</C.Button>
		<C.Button onClick={importUnits} disabled={!link.length}>Import</C.Button>
	</div>
{/snippet}

<C.Modal title="Import units from link" {close} {controls}>
	{#if error}
		<div class="errors-container">
			<C.Errors errors={error} />
		</div>
	{/if}

	<C.Fieldset label="Import link" htmlName="importLink" style="margin-bottom: 1em" --input-width="100%">
		<C.Input bind:value={link} name="importLink" placeholder="https://link.clashofclans.com/..." />
	</C.Fieldset>
</C.Modal>

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
