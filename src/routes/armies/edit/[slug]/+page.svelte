<script lang="ts">
	import type { PageData } from './$types';
	import type { AppState } from '$types';
	import { getContext } from 'svelte';
	import C from '$components';

	const { data }: { data: PageData } = $props();
	const { army } = $derived(data);

	const app = getContext<AppState>('app');
</script>

<svelte:head>
	<!-- Note: title tag lives within the EditArmy component -->
	<!-- Note: this route shouldn't be indexable so no point in meta:description/canonical tags -->
</svelte:head>

<section class="army">
	<div class="container">
		{#if army.createdBy === app.user?.id || app.user?.hasRoles('admin')}
			<C.EditArmy {army} />
		{:else}
			<!-- TODO: make this nicer -->
			<h2 style="text-align: center;">You do not have permission to edit this army</h2>
		{/if}
	</div>
</section>

<style>
	.army {
		padding: 24px var(--side-padding) 32px var(--side-padding);
		flex: 1 0 0px;

		@media (max-width: 500px) {
			padding: 16px var(--side-padding) 24px var(--side-padding);
		}
	}
</style>
