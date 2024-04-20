<script lang="ts">
	import { onMount } from 'svelte';
	import type { TownHall, FetchErrors } from '~/lib/shared/types';
	import { invalidateAll } from '$app/navigation';
	import { deserialize } from '$app/forms';
	import C from '~/components';

	type Props = {
		/** Function that closes the modal */
		close: () => void;
		/** Existing town hall */
		townHall?: TownHall;
	};
	let { close, townHall } = $props<Props>();

	let image = $state<FileList | null>(null);
	let level = $state<number | null>(null);
	let maxBarracks = $state<number | null>(null);
	let maxDarkBarracks = $state<number | null>(null);
	let maxSpellFactory = $state<number | null>(null);
	let maxDarkSpellFactory = $state<number | null>(null);
	let maxLaboratory = $state<number | null>(null);
	let maxWorkshop = $state<number | null>(null);
	let troopCapacity = $state<number | null>(null);
	let siegeCapacity = $state<number | null>(null);
	let spellCapacity = $state<number | null>(null);

	let errors = $state<FetchErrors | null>(null);

	onMount(() => {
		if (!townHall) return;
		level = townHall.level;
		maxBarracks = townHall.maxBarracks;
		maxDarkBarracks = townHall.maxDarkBarracks;
		maxSpellFactory = townHall.maxSpellFactory;
		maxDarkSpellFactory = townHall.maxDarkSpellFactory;
		maxLaboratory = townHall.maxLaboratory;
		maxWorkshop = townHall.maxWorkshop;
		troopCapacity = townHall.troopCapacity;
		siegeCapacity = townHall.siegeCapacity;
		spellCapacity = townHall.spellCapacity;
	});

	async function saveTownHall() {
		const body = new FormData();
		const data = {
			id: townHall?.level,
			level,
			maxBarracks,
			maxDarkBarracks,
			maxSpellFactory,
			maxDarkSpellFactory,
			maxLaboratory,
			maxWorkshop,
			troopCapacity,
			siegeCapacity,
			spellCapacity
		};
		body.append('townHall', JSON.stringify(data));
		if (image && image[0]) {
			body.append('image', image[0]);
		}
		const response = await fetch('?/saveTownHall', { method: 'POST', body });
		const result = deserialize(await response.text());
		if (result.type === 'failure') {
			errors = result.data?.errors as FetchErrors;
		} else {
			await invalidateAll();
			close();
		}
	}

	async function deleteTownHall() {
		if (!townHall) return;
		const body = new FormData();
		body.append('level', JSON.stringify(townHall.level));
		const response = await fetch('?/deleteTownHall', { method: 'POST', body });
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
		{#if townHall}
			<C.Button onclick={deleteTownHall} theme="danger">Delete</C.Button>
		{/if}
		<div class="right">
			<C.Button onclick={close}>Cancel</C.Button>
			<C.Button onclick={saveTownHall}>Save</C.Button>
		</div>
	</div>
{/snippet}

<form method="POST" action="?/saveTownHall" enctype="multipart/form-data">
	<C.Modal title="{townHall ? 'Edit' : 'Add'} town hall" {close} {controls}>
		<C.Errors {errors} />

		<C.Fieldset label="Image" htmlName="image" style="margin-bottom: 1em; {errors !== null ? 'margin-top: 1em' : ''}">
			<div class="image-container">
				{#if image}
					<img src={URL.createObjectURL(image[0])} alt="Town hall {level ?? '?'}" class="image" />
				{:else if townHall}
					<img src="/clash/town-halls/{townHall.level}.png" alt="Town hall {townHall.level}" class="image" />
				{/if}
				<input class="image-input" type="file" name="image" accept=".png" bind:files={image} />
			</div>
		</C.Fieldset>
		<C.Fieldset label="Level" htmlName="level" style="margin-bottom: 1em">
			<C.Input bind:value={level} type="number" name="level" --input-width="100%" />
		</C.Fieldset>
		<div class="row">
			<C.Fieldset label="Max barracks" htmlName="maxBarracks">
				<C.Input bind:value={maxBarracks} type="number" name="maxBarracks" --input-width="100%" />
			</C.Fieldset>
			<C.Fieldset label="Max dark barracks" htmlName="maxDarkBarracks">
				<C.Input bind:value={maxDarkBarracks} type="number" name="maxDarkBarracks" --input-width="100%" />
			</C.Fieldset>
		</div>
		<div class="row">
			<C.Fieldset label="Max spell factory" htmlName="maxSpellFactory">
				<C.Input bind:value={maxSpellFactory} type="number" name="maxSpellFactory" --input-width="100%" />
			</C.Fieldset>
			<C.Fieldset label="Max dark spell factory" htmlName="maxDarkSpellFactory">
				<C.Input bind:value={maxDarkSpellFactory} type="number" name="maxDarkSpellFactory" --input-width="100%" />
			</C.Fieldset>
		</div>
		<C.Fieldset label="Max laboratory" htmlName="maxLaboratory" style="margin-bottom: 1em">
			<C.Input bind:value={maxLaboratory} type="number" name="maxLaboratory" --input-width="100%" />
		</C.Fieldset>
		<C.Fieldset label="Max workshop" htmlName="maxWorkshop" style="margin-bottom: 1em">
			<C.Input bind:value={maxWorkshop} type="number" name="maxWorkshop" --input-width="100%" />
		</C.Fieldset>
		<div class="row">
			<C.Fieldset label="Troop capacity" htmlName="troopCapacity">
				<C.Input bind:value={troopCapacity} type="number" name="troopCapacity" --input-width="100%" />
			</C.Fieldset>
			<C.Fieldset label="Siege capacity" htmlName="siegeCapacity">
				<C.Input bind:value={siegeCapacity} type="number" name="siegeCapacity" --input-width="100%" />
			</C.Fieldset>
			<C.Fieldset label="Spell capacity" htmlName="spellCapacity">
				<C.Input bind:value={spellCapacity} type="number" name="spellCapacity" --input-width="100%" />
			</C.Fieldset>
		</div>
	</C.Modal>
</form>

<style>
	.row {
		display: flex;
		gap: 0.5em;
	}

	.row:not(:last-child) {
		margin-bottom: 1em;
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
</style>
