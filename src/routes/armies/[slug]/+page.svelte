<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import C from '~/components';

	const { data } = $props<{ data: PageData }>();
	const { army } = $derived(data);

	// TODO: add warning before switching to view or navigating away if user has unsaved changes

	let editing = $state<boolean>(Boolean($page.url.searchParams.get('editing')));

	function onModeChange(value: boolean) {
		// persist mode across refreshes
		if (value) {
			$page.url.searchParams.set('editing', String(value));
		} else {
			$page.url.searchParams.delete('editing');
		}
		goto(`?${$page.url.searchParams.toString()}`);
	}
</script>

<div class="outer">
	<div class="container">
		<C.Switch bind:value={editing} onToggle={onModeChange} offText="View" onText="Edit" labelStyle="font-family: 'Clash', sans-serif;" htmlName="mode" />
	</div>
</div>

{#if !editing}
	<C.ViewArmy {army} />
{:else}
	<C.EditArmy {army} />
{/if}

<style>
	.outer {
		padding: 50px var(--side-padding) 24px var(--side-padding);
	}
</style>
