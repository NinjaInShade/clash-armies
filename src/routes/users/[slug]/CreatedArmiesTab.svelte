<script lang="ts">
	import C from '$components';
	import { getContext } from 'svelte';
	import type { AppState, Army, User } from '$types';

	type Props = {
		armies: Army[];
		user: User;
	};
	const { armies, user }: Props = $props();

	const app = getContext<AppState>('app');
	const username = $derived(user.username);
	const currentUser = $derived(app.user ? app.user.username : null);
</script>

<div class="header">
	<h2>Created armies</h2>
	{#if currentUser === username && armies.length > 0}
		<C.ActionButton asLink href="/create" theme="success">Create army</C.ActionButton>
	{/if}
</div>
{#if armies.length}
	<ul class="armies-list">
		{#each armies as army (army.id)}
			<C.ArmyCard {army} />
		{/each}
	</ul>
{:else}
	<div class="no-armies">
		<img src="/clash/ui/falling-barb.png" alt="Falling barbarian" />
		<h2>
			{#if currentUser === username}
				You haven't created any armies warrior!
			{:else}
				This user hasn't created any armies
			{/if}
		</h2>
		{#if currentUser === username}
			<C.Button asLink href="/create">Create army</C.Button>
		{/if}
	</div>
{/if}

<style>
	.header {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		margin-bottom: 1em;
		gap: 0.5em;
	}

	.armies-list {
		display: flex;
		flex-flow: column nowrap;
		gap: 1em;
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
