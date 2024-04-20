<script lang="ts">
	import type { AppState } from '~/lib/state.svelte';
	import TownHall from '~/components/TownHall.svelte';
	import Modal from './Modal.svelte';

	type Props = {
		/** App state so we can access and change selected town hall */
		appState: AppState;
		/** Function that closes the modal */
		close: () => void;
	};
	let { appState, close } = $props<Props>();

	function setTownHall(level: number) {
		appState.townHall = level;
		localStorage.setItem('townHall', `${level}`);
		close();
	}
</script>

<Modal title="Select your town hall" {close}>
	<div class="flex">
		{#each appState.townHallLevels as level}
			{@const isSelected = appState.townHall === level}
			{@const btnAttributes = { title: isSelected ? `Town hall ${level} is already selected` : `Town hall ${level}`, disabled: isSelected }}
			<TownHall onclick={setTownHall} {level} {...btnAttributes} />
		{/each}
	</div>
</Modal>

<style>
	.flex {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		grid-template-rows: auto;
		gap: 8px;
	}
</style>
