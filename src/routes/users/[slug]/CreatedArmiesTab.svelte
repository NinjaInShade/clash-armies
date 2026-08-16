<script lang="ts">
	import { getContext } from 'svelte';
	import ImgFallingBarb from '$assets/ui/falling-barb.webp';
	import ActionButton from '$components/ActionButton.svelte';
	import ArmyList from '$components/Armies/ArmyList.svelte';
	import Button from '$components/Button.svelte';
	import type { Army } from '$models/Army.svelte';
	import type { AppState, User } from '$types';

	type Props = {
		armies: Army[];
		total: number;
		user: User;
	};
	const { armies, total, user }: Props = $props();

	const app = getContext<AppState>('app');
	const username = $derived(user.username);
	const currentUser = $derived(app.user ? app.user.username : null);
</script>

<div class="header">
	<h2>Created armies</h2>
	{#if currentUser === username && total > 0}
		<ActionButton asLink href="/army-builder" theme="success">Create army</ActionButton>
	{/if}
</div>

<ArmyList data={armies} {total} paginationScrollTarget={120} {emptyState} />

{#snippet emptyState()}
	<div class="no-armies">
		<img src={ImgFallingBarb} alt="Falling barbarian" />
		<h2>
			{#if currentUser === username}
				You haven't created any armies warrior!
			{:else}
				This user hasn't created any armies
			{/if}
		</h2>
		{#if currentUser === username}
			<Button asLink href="/army-builder">Create army</Button>
		{/if}
	</div>
{/snippet}

<style>
	.header {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		margin-bottom: 1em;
		gap: 0.5em;
	}

	.no-armies {
		display: flex;
		justify-content: center;
		align-items: center;
		flex-flow: column nowrap;
		background-color: var(--grey-800);
		border-radius: 8px;
		padding: 3em 1em;
	}

	.no-armies h2 {
		max-width: 320px;
		text-align: center;
		line-height: 1.3;
		font-weight: 400;
		margin-top: 1em;
	}

	.no-armies :global(h2:has(+ a)) {
		margin-bottom: 1em;
	}

	.no-armies img {
		max-width: 400px;
		width: 100%;
		position: relative;
	}

	@media (max-width: 375px) {
		.header {
			flex-flow: column nowrap;
			align-items: flex-start;
			gap: 0.5em;
		}
	}
</style>
