<script lang="ts">
	import C from '$components';
	import { getContext, untrack } from 'svelte';
	import type { AppState } from '$types';
	import type { PageData } from './$types';
	import { ArmyModel } from '$models';
	import { format } from 'date-fns';
	import EditUser from './EditUser.svelte';
	import CreatedArmiesTab from './CreatedArmiesTab.svelte';
	import SavedArmiesTab from './SavedArmiesTab.svelte';

	const { data }: { data: PageData } = $props();
	const { user } = $derived(data);

	const app = getContext<AppState>('app');
	const username = $derived(user.username);
	const currentUser = $derived(app.user ? app.user.username : null);

	const savedArmies = $derived(
		data.savedArmies.map((army) => {
			return untrack(() => new ArmyModel(app, army));
		})
	);
	const armies = $derived(
		data.armies.map((army) => {
			return untrack(() => new ArmyModel(app, army));
		})
	);

	function editUser() {
		app.openModal(EditUser, { user });
	}
</script>

<svelte:head>
	<title>ClashArmies • {currentUser === username ? 'Account' : `Users • ${username}`}</title>
	<meta
		name="description"
		content="View Clash of Clans armies and strategies shared by {username}. Discover top-rated builds, guides, and user contributions."
	/>
	<link rel="canonical" href="https://clasharmies.com/users/{username}" />
</svelte:head>

<header>
	<div class="container">
		<div class="left">
			<div class="profile-pic">
				<img src="/ui/barb-king.webp" alt="Barbarian king" class="profile-pic-img" />
			</div>
			<div class="user-data">
				<div class="level">
					<b class="level-value">{user.level ?? '?'}</b>
					<img src="/ui/experience.webp" alt="Clash of clans experience" class="level-img" />
				</div>
				<h2 class="username">{username}</h2>
				<h3 class="player-tag">{user.playerTag ?? '#??????'}</h3>
				<p class="member-since">Member since {format(user.createdTime, 'MMMM yyyy')}</p>
			</div>
		</div>
		{#if username === currentUser || app.user?.hasRoles('admin')}
			<div class="right">
				<C.Button onClick={editUser}>Edit</C.Button>
			</div>
		{/if}
	</div>
</header>

<section class="tabs">
	<div class="container">
		<C.TabStrip
			tabs={[
				{ name: 'created', label: `Created (${armies.length})`, component: CreatedArmiesTab, componentProps: { armies, user } },
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
		max-width: 124px;
		height: 132px;
		width: 100%;
		padding: 0.3em;
	}

	.profile-pic-img {
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

	.member-since {
		color: var(--grey-400);
		font-weight: 500;
		font-size: 0.9em;
		margin-top: 0.35em;
	}

	.tabs {
		padding: 0 var(--side-padding) 50px var(--side-padding);
		flex: 1 0 0px;
	}

	.right {
		padding-bottom: 0.5em;
	}

	@media (max-width: 850px) {
		.profile-pic {
			height: 124px;
			padding: 0.5em;
		}

		.profile-pic-img {
			top: -4px;
		}

		.member-since {
			font-size: 0.8em;
			margin-top: 0.2em;
		}
	}

	@media (max-width: 500px) {
		header {
			padding: 50px var(--side-padding) 0 var(--side-padding);
		}
	}
</style>
