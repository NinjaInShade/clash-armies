<script lang="ts">
	import { getContext } from 'svelte';
	import type { AppState, Army, User } from '~/lib/shared/types';
	import C from '~/components';

	type Props = {
		savedArmies: Army[];
		user: User;
	};
	const { savedArmies, user }: Props = $props();

	const app = getContext<AppState>('app');
	const username = $derived(user.username);
	const currentUser = $derived(app.user ? app.user.username : null);
</script>

<h2 class="title">Saved armies</h2>
{#if savedArmies.length}
	<ul class="armies-list">
		{#each savedArmies as army (army.id)}
			<C.ArmyCard {army} showBookmark={app.user?.id === user.id} />
		{/each}
	</ul>
{:else}
	<div class="no-armies">
		<img src="/clash/ui/falling-barb.png" alt="Falling barbarian" />
		<h2>
			{#if currentUser === username}
				You haven't saved any armies warrior!
			{:else}
				This user hasn't saved any armies
			{/if}
		</h2>
	</div>
{/if}

<style>
	.armies-list {
		display: flex;
		flex-flow: column nowrap;
		gap: 1em;
	}

	.title {
		margin-bottom: 16px;
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

	.no-armies img {
		max-width: 400px;
		width: 100%;
		position: relative;
	}
</style>
