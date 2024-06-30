<script lang="ts">
	import C from '~/components';
	import { getContext } from 'svelte';
	import type { AppState } from '~/lib/shared/types';
	import { USER_MAX_ARMIES } from '~/lib/shared/utils';
	import type { PageData } from './$types';
	import EditUser from './EditUser.svelte';
	import { page } from '$app/stores';

	const { data } = $props<{ data: PageData }>();
	const { armies, user } = $derived(data);

	const app = getContext<AppState>('app');

	const username = $derived($page.params.slug);
	const currentUser = $derived(app.user ? app.user.username : null);

	function editUser() {
		app.openModal(EditUser, { user });
	}
</script>

<svelte:head>
	<title>ClashArmies • {currentUser === username ? 'Account' : `Users • ${user.username}`}</title>
</svelte:head>

<header>
	<div class="container">
		<div class="left">
			<div class="profile-pic">
				<img src="/clash/ui/barb-king.png" alt="Barbarian king" class="profile-pic-img" />
			</div>
			<div class="user-data">
				<div class="level">
					<b class="level-value">{user.level ?? '?'}</b>
					<img src="/clash/ui/experience.png" alt="Clash of clans experience" class="level-img" />
				</div>
				<h2 class="username">{username}</h2>
				<h3 class="player-tag">#{user.playerTag ?? '??????'}</h3>
			</div>
		</div>
		<div class="right">
			{#if username === currentUser || app.user?.hasRoles('admin')}
				<C.Button onclick={editUser}>Edit</C.Button>
			{/if}
		</div>
	</div>
</header>

<section class="armies">
	<div class="container">
		<h2 class="armies-title">Armies {currentUser === username ? `(${armies.length} / ${USER_MAX_ARMIES})` : ''}</h2>
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
	</div>
</section>

<style>
	header {
		padding: 80px var(--side-padding) 0 var(--side-padding);
	}

	header .container {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		border-bottom: 1px solid var(--grey-500);
		padding-bottom: 1.5em;
		gap: 1em;
	}

	header .left {
		display: flex;
		align-items: center;
		gap: 1em;
	}

	.profile-pic {
		background-color: var(--grey-800);
		border-radius: 8px;
		max-width: 110px;
		height: 90px;
		width: 100%;
	}

	.profile-pic-img {
		top: -32px;
		position: relative;
		max-width: 100%;
	}

	.user-data {
		padding-bottom: 0.5em;
	}

	.level {
		position: relative;
		max-width: 26px;
	}

	.level-value {
		position: absolute;
		transform: translate(-50%, -50%);
		color: var(--grey-100);
		text-shadow: var(--txt-shadow-dark);
		-webkit-text-stroke: var(--txt-stroke);
		font-size: 0.9em;
		line-height: 0.9em;
		font-weight: 900;
		left: 50%;
		top: 50%;
	}

	.level-img {
		display: block;
		max-width: 100%;
	}

	.username {
		color: var(--primary-400);
		margin: 0.35em 0 0.4em 0;
	}

	.player-tag {
		color: var(--grey-400);
		font-weight: 400;
	}

	.armies {
		padding: 50px var(--side-padding);
		flex: 1 0 0px;
	}

	.armies-title {
		margin-bottom: 0.75em;
	}

	.armies-list {
		display: flex;
		flex-flow: column nowrap;
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

	.no-armies h2:has(+ a) {
		margin-bottom: 1em;
	}

	.no-armies img {
		max-width: 400px;
		width: 100%;
		position: relative;
	}

	.right {
		padding-bottom: 0.5em;
	}
</style>
