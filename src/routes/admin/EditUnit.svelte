<script lang="ts">
	import { onMount } from 'svelte';
	import type { Unit, UnitType, UnitLevel, FetchErrors } from '~/lib/shared/types';
	import { invalidateAll } from '$app/navigation';
	import { deserialize } from '$app/forms';
	import C from '~/components';

	// TODO: fix this type, id/unitId should be optional as we may be creating and don't have that info yet
	type Level = Omit<UnitLevel, 'id' | 'unitId'>;

	type Props = {
		/** Function that closes the modal */
		close: () => void;
		/** Existing unit */
		unit?: Unit;
	};
	let { close, unit }: Props = $props();

	let image = $state<FileList | null>(null);

	let type = $state<UnitType | null>(null);
	let name = $state<string | null>(null);
	let objectId = $state<number | null>(null);
	let housingSpace = $state<number | null>(null);
	let trainingTime = $state<number | null>(null);
	let productionBuilding = $state<string | null>(null);
	let isSuper = $state<boolean>(false);
	let isFlying = $state<boolean>(false);
	let isJumper = $state<boolean>(false);
	let airTargets = $state<boolean>(false);
	let groundTargets = $state<boolean>(false);

	let levels = $state<Level[]>([]);

	let errors = $state<FetchErrors | null>(null);

	function sortLevels(a: Level, b: Level) {
		if (a.level < b.level) {
			return 1;
		}
		if (b.level < a.level) {
			return -1;
		}
		return 0;
	}

	function addLevel() {
		const max = levels.length ? Math.max(...levels.map((x) => x.level)) : 0;
		levels.push({
			unitId: unit?.id,
			level: max + 1,
			spellFactoryLevel: null,
			barrackLevel: null,
			laboratoryLevel: null
		});
		levels.sort(sortLevels);
	}

	onMount(() => {
		if (!unit) return;
		type = unit.type;
		name = unit.name;
		objectId = unit.objectId;
		housingSpace = unit.housingSpace;
		trainingTime = unit.trainingTime;
		productionBuilding = unit.productionBuilding;
		isSuper = unit.isSuper;
		isFlying = unit.isFlying;
		isJumper = unit.isJumper;
		airTargets = unit.airTargets;
		groundTargets = unit.groundTargets;
		levels = unit.levels;
		levels.sort(sortLevels);
	});

	const UNIT_TYPES = [
		{ value: 'Troop', label: 'Troop' },
		{ value: 'Siege', label: 'Siege' },
		{ value: 'Spell', label: 'Spell' }
	];
	const PROD_BUILDINGS = [
		{ value: 'Barrack', label: 'Barrack' },
		{ value: 'Dark Elixir Barrack', label: 'Dark Elixir Barrack' },
		{ value: 'Siege Workshop', label: 'Siege Workshop' },
		{ value: 'Spell Factory', label: 'Spell Factory' },
		{ value: 'Dark Spell Factory', label: 'Dark Spell Factory' }
	];

	async function saveUnit() {
		const body = new FormData();
		const data = {
			id: unit?.id,
			name,
			type,
			objectId,
			housingSpace,
			trainingTime,
			productionBuilding,
			isSuper,
			isFlying,
			isJumper,
			airTargets,
			groundTargets,
			levels
		};
		body.append('unit', JSON.stringify(data));
		if (image && image[0]) {
			body.append('image', image[0]);
		}
		const response = await fetch('?/saveUnit', { method: 'POST', body });
		const result = deserialize(await response.text());
		if (result.type === 'failure') {
			errors = result.data?.errors as FetchErrors;
		} else {
			await invalidateAll();
			close();
		}
	}

	async function deleteUnit() {
		if (!unit) return;
		const body = new FormData();
		body.append('id', JSON.stringify(unit.id));
		const response = await fetch('?/deleteUnit', { method: 'POST', body });
		const result = deserialize(await response.text());
		if (result.type === 'failure') {
			errors = result.data?.errors as FetchErrors;
		} else {
			await invalidateAll();
			close();
		}
	}
</script>

{#snippet controls()}
	<div class="controls">
		{#if unit}
			<C.Button onclick={deleteUnit} theme="danger">Delete</C.Button>
		{/if}
		<div class="right">
			<C.Button onclick={close}>Cancel</C.Button>
			<C.Button onclick={saveUnit}>Save</C.Button>
		</div>
	</div>
{/snippet}

<C.Modal title="{unit ? 'Edit' : 'Add'} unit" {close} {controls} --modal-width="800px">
	<C.Errors {errors} />

	<C.Fieldset label="Image" htmlName="image" style="margin-bottom: 1em; {errors !== null ? 'margin-top: 1em' : ''}">
		<div class="image-container">
			{#if image}
				<img src={URL.createObjectURL(image[0])} alt="{type ?? '?'}: {name ?? '?'}" class="image" />
			{:else if unit}
				<img src="/clash/units/{unit.name}.png" alt="{unit.type}: {unit.name}" class="image" />
			{/if}
			<input class="image-input" type="file" name="image" accept=".png" bind:files={image} />
		</div>
	</C.Fieldset>

	<div class="row">
		<C.Fieldset label="Name" htmlName="name" style="flex: 1 0 0px;" --input-width="100%">
			<C.Input bind:value={name} />
		</C.Fieldset>
		<C.Fieldset label="Type" htmlName="type" style="flex: 1 0 0px;" --input-width="100%">
			<C.Select data={UNIT_TYPES} bind:value={type} />
		</C.Fieldset>
	</div>

	<div class="row">
		<C.Fieldset label="Production building" htmlName="productionBuilding" style="flex: 1 0 0px;" --input-width="100%">
			<C.Select data={PROD_BUILDINGS} bind:value={productionBuilding} />
		</C.Fieldset>
		<C.Fieldset label="Object ID" htmlName="objectId" style="flex: 1 0 0px;" --input-width="100%">
			<C.Input bind:value={objectId} type="number" />
		</C.Fieldset>
	</div>

	<div class="row">
		<C.Fieldset label="Housing space" htmlName="housingSpace" style="flex: 1 0 0px;" --input-width="100%">
			<C.Input bind:value={housingSpace} type="number" />
		</C.Fieldset>
		<C.Fieldset label="Training time" htmlName="trainingTime" style="flex: 1 0 0px;" --input-width="100%">
			<C.Input bind:value={trainingTime} type="number" />
		</C.Fieldset>
	</div>

	<div class="row">
		<C.Fieldset label="Is super?" htmlName="isSuper" labelDir="row-reverse" style="flex: 0 1 0px" --input-width="100%">
			<C.Checkbox bind:value={isSuper} />
		</C.Fieldset>
		<C.Fieldset label="Can fly?" htmlName="isFlying" labelDir="row-reverse" style="flex: 0 1 0px" --input-width="100%">
			<C.Checkbox bind:value={isFlying} />
		</C.Fieldset>
		<C.Fieldset label="Can jump?" htmlName="isJumper" labelDir="row-reverse" style="flex: 0 1 0px" --input-width="100%">
			<C.Checkbox bind:value={isJumper} />
		</C.Fieldset>
		<C.Fieldset label="Targets air?" htmlName="airTargets" labelDir="row-reverse" style="flex: 0 1 0px" --input-width="100%">
			<C.Checkbox bind:value={airTargets} />
		</C.Fieldset>
		<C.Fieldset label="Targets ground?" htmlName="groundTargets" labelDir="row-reverse" style="flex: 0 1 0px" --input-width="100%">
			<C.Checkbox bind:value={groundTargets} />
		</C.Fieldset>
	</div>

	<div class="levels-container">
		<div style="display: flex; align-items: center; gap: 1em; margin-bottom: 1em;">
			<h2>Levels</h2>
			<button type="button" class="add-level" onclick={addLevel}>Add</button>
		</div>
		{#each levels as level}
			<div class="row levels">
				<C.Fieldset label="Level" htmlName="level-{level.level}-level" style="flex: 1 0 0px;" --input-width="100%">
					<C.Input bind:value={level.level} type="number" />
				</C.Fieldset>
				<C.Fieldset label="Spell factory" htmlName="level-{level.level}-spellFactoryLevel" style="flex: 1 0 0px;" --input-width="100%">
					<C.Input bind:value={level.spellFactoryLevel} type="number" />
				</C.Fieldset>
				<C.Fieldset label="Barrack" htmlName="level-{level.level}-barrackLevel" style="flex: 1 0 0px;" --input-width="100%">
					<C.Input bind:value={level.barrackLevel} type="number" />
				</C.Fieldset>
				<C.Fieldset label="Laboratory" htmlName="level-{level.level}-laboratoryLevel" style="flex: 1 0 0px;" --input-width="100%">
					<C.Input bind:value={level.laboratoryLevel} type="number" />
				</C.Fieldset>
				<C.Button
					theme="danger"
					style="height: 40px; width: 40px;"
					onclick={() => {
						levels = levels.filter((x) => x.level !== level.level);
					}}
				>
					X
				</C.Button>
			</div>
		{/each}
	</div>
</C.Modal>

<style>
	.row {
		display: flex;
		width: 100%;
		gap: 0.5em;
	}

	.row.levels {
		align-items: flex-end;
	}

	.row:not(:last-child) {
		margin-bottom: 1em;
	}

	.row.levels:not(:last-child) {
		margin-bottom: 0.5em;
	}

	.image-container {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		transition: all 0.15s ease-in-out;
		border: 1.5px dashed var(--grey-500);
		padding: 0.5em;
		height: 100px;
		width: 100px;
	}

	.image-container:hover,
	.image-container:has(input:focus) {
		border-color: var(--primary-400);
	}

	.image {
		display: block;
		width: 100%;
	}

	.image-input {
		cursor: pointer;
		position: absolute;
		opacity: 0;
		height: 100%;
		width: 100%;
		left: 0;
		top: 0;
	}

	.controls {
		display: flex;
		justify-content: space-between;
		width: 100%;
		gap: 0.5em;
	}

	.controls .right {
		margin-left: auto;
		display: flex;
		gap: 0.5em;
	}

	.levels-container {
		margin-top: 2em;
		border-radius: 6px;
		border: 1.5px dashed var(--grey-500);
		padding: 1em;
	}

	.add-level {
		color: var(--grey-400);
	}

	.add-level:hover {
		text-decoration: underline;
	}
</style>
