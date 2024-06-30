<script lang="ts">
	import { page } from '$app/stores';
	import type { PageData } from './$types';
	import type { AppState } from '~/lib/shared/types';
	import { getContext } from 'svelte';
	import C from '~/components';

	const { data }: { data: PageData } = $props();
	const { army } = $derived(data);

	const app = getContext<AppState>('app');

	// TODO: add warning before switching to view or navigating away if user has unsaved changes
	let editing = $derived<boolean>(!!$page.url.searchParams.get('editing'));
</script>

<section class="army">
	<div class="container">
		{#if editing}
			{#if army.createdBy === app.user?.id || app.user?.hasRoles('admin')}
				<C.EditArmy {army} />
			{:else}
				<!-- TODO: make this nicer -->
				<h2 style="text-align: center;">You do not have permission to edit this army</h2>
			{/if}
		{:else}
			<C.ViewArmy {army} />
		{/if}
	</div>
</section>

<style>
	.army {
		padding: 32px var(--side-padding);
		flex: 1 0 0px;
	}

	@media (max-width: 850px) {
		.army {
			padding: 32px var(--side-padding) 24px var(--side-padding);
		}
	}
</style>
