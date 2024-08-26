<script lang="ts">
	import C from '~/components';
	import { USER_MAX_ARMIES } from '~/lib/shared/utils';
	import { getContext } from 'svelte';
	import type { AppState } from '~/lib/shared/types';
	import type { PageData } from './$types';
	import EditUser from './EditUser.svelte';
	import CreatedArmiesTab from './CreatedArmiesTab.svelte';
	import SavedArmiesTab from './SavedArmiesTab.svelte';

	const { data }: { data: PageData } = $props();
	const { armies, savedArmies, user } = $derived(data);

	const app = getContext<AppState>('app');
	const username = $derived(user.username);
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
				<C.Button onClick={editUser}>Edit</C.Button>
			{/if}
		</div>
	</div>
</header>

<section class="tabs">
	<div class="container">
		<C.TabStrip
			tabs={[
				{ name: 'created', label: `Created (${armies.length}/${USER_MAX_ARMIES})`, component: CreatedArmiesTab, componentProps: { armies, user } },
				{ name: 'saved', label: `Saved (${savedArmies.length})`, component: SavedArmiesTab, componentProps: { savedArmies, user } },
			]}
		/>
	</div>
</section>

<style>
	header {
		padding: 80px var(--side-padding) 0 var(--side-padding);
	}

	header .container {
		display: flex;
		flex-flow: row wrap;
		justify-content: space-between;
		align-items: flex-end;
		padding-bottom: 2.25em;
		gap: 1em;
	}

	header .left {
		display: flex;
		align-items: center;
		gap: 1em;
	}

	.profile-pic {
		flex-shrink: 0;
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
		word-break: break-all;
		color: var(--primary-400);
		margin: 0.35em 0 0.2em 0;
	}

	.player-tag {
		color: var(--grey-400);
		font-weight: 400;
	}

	.tabs {
		padding: 0 var(--side-padding) 50px var(--side-padding);
		flex: 1 0 0px;
	}

	.right {
		padding-bottom: 0.5em;
	}
</style>
