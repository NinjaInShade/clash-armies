<script lang="ts">
	import { getContext } from 'svelte';
	import type { AppState, ImportedUnit, ImportedHero, UnsavedUnit, UnsavedPet, UnsavedEquipment } from '$types';
	import { validateUnits, validateCcUnits, validateEquipment, validatePets } from '$shared/validation';
	import { parseLink } from '$client/army';
	import Button from './Button.svelte';
	import Modal from './Modal.svelte';
	import Errors from './Errors.svelte';
	import Fieldset from './Fieldset.svelte';
	import Input from './Input.svelte';

	type Props = {
		/** Function that closes the modal */
		close: (data?: { units: ImportedUnit[]; ccUnits: ImportedUnit[]; heroes: Record<string, ImportedHero> }) => void;
		selectedUnits: UnsavedUnit[];
		selectedCCUnits: UnsavedUnit[];
		selectedEquipment: UnsavedEquipment[];
		selectedPets: UnsavedPet[];
		selectedTownHall: number;
	};
	const { close, selectedUnits, selectedCCUnits, selectedEquipment, selectedPets, selectedTownHall }: Props = $props();
	const app = getContext<AppState>('app');

	let link = $state<string>('');
	let error = $state<string | null>(null);

	async function importUnits() {
		let importedUnits: ReturnType<typeof parseLink>['units'] = [];
		let importedCCUnits: ReturnType<typeof parseLink>['ccUnits'] = [];
		let importedHeroes: ReturnType<typeof parseLink>['heroes'] = {};
		try {
			const imported = parseLink(link, { units: app.units, pets: app.pets, equipment: app.equipment });
			importedUnits = imported.units;
			importedCCUnits = imported.ccUnits;
			importedHeroes = imported.heroes;
		} catch (err: unknown) {
			error = err.message;
			return;
		}
		if (!importedUnits.length && !importedCCUnits.length && !Object.keys(importedHeroes).length) {
			error = "This import link didn't have any units - are you sure it's correct?";
			return;
		}
		try {
			const equipment: UnsavedEquipment[] = [];
			const pets: UnsavedPet[] = [];
			for (const hero of Object.values(importedHeroes)) {
				equipment.push(...(hero.eq1 ? [hero.eq1] : []));
				equipment.push(...(hero.eq2 ? [hero.eq2] : []));
				pets.push(...(hero.pet ? [hero.pet] : []));
			}
			const ctx = { units: app.units, equipment: app.equipment, pets: app.pets, townHalls: app.townHalls };
			validateUnits(importedUnits, selectedTownHall, ctx);
			validateCcUnits(importedCCUnits, selectedTownHall, ctx);
			validateEquipment(equipment, selectedTownHall, ctx);
			validatePets(pets, selectedTownHall, ctx);
		} catch (err: unknown) {
			error = err.message;
			return;
		}
		if (selectedUnits.length || selectedCCUnits.length || selectedEquipment.length || selectedPets.length) {
			const confirmed = await app.confirm('Importing these units will clear existing ones. Import anyway?');
			if (!confirmed) return;
		}
		if (!importedUnits.length && !importedCCUnits.length && !Object.keys(importedHeroes).length) {
			close(undefined);
		} else {
			close({ units: importedUnits, ccUnits: importedCCUnits, heroes: importedHeroes });
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
