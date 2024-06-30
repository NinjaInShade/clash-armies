<script lang="ts">
	import type { AppState } from '~/lib/shared/types';
	import C from '~/components';

	type Props = {
		/** App state so we can access and change selected town hall */
		appState: AppState;
		/** Function that closes the modal */
		close: () => void;
	};
	let { appState, close }: Props = $props();

	function setTownHall(level: number) {
		appState.townHall = level;
		localStorage.setItem('townHall', `${level}`);
		close();
	}
</script>

<C.Modal title="Select your town hall" {close}>
	<div class="flex">
		{#each appState.townHalls as th}
			{@const isSelected = appState.townHall === th.level}
			{@const btnAttributes = { title: isSelected ? `Town hall ${th.level} is already selected` : `Town hall ${th.level}`, disabled: isSelected }}
			<C.TownHall onclick={setTownHall} level={th.level} {...btnAttributes} />
		{/each}
	</div>
</C.Modal>

<style>
	.flex {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		grid-template-rows: auto;
		gap: 8px;
	}
</style>
