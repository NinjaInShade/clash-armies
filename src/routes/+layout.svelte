<script lang="ts">
	import { fade } from 'svelte/transition';
	import { sineInOut } from 'svelte/easing';
	import { onMount, setContext, type Snippet } from 'svelte';
	import { version } from '$app/environment';
	import type { LayoutData } from './$types';
	import { createAppState, requireHTML } from '~/lib/client/state.svelte';
	import type { AppState } from '~/lib/shared/types';
	import C from '~/components';

	type Props = {
		data: LayoutData;
		children: Snippet;
	};
	let { data, children }: Props = $props();

	let devDebugOpen: boolean = $state(false);

	/** Extends user to include properties AppState needs */
	function extendUser(user: LayoutData['user']): AppState['user'] {
		if (!user) {
			return null;
		}
		return {
			...user,
			hasRoles(...roles: string[]) {
				return roles.every((role) => user.roles.includes(role));
			}
		};
	}

	/**
	 * Due to first render being SSR, any state that will be overridden by localStorage onMount
	 * should start as null and consumers should show loading animations until the values are set.
	 */
	const appState = createAppState({
		// frequently used data (cache)
		units: data.units,
		townHalls: data.townHalls,
		// user state
		townHall: null,
		barrack: null,
		darkBarrack: null,
		laboratory: null,
		spellFactory: null,
		darkSpellFactory: null,
		workshop: null,
		armyCapacity: { troop: 0, spell: 0, siege: 0 },
		// general app state
		modals: [],
		user: extendUser(data.user)
	});
	setContext('app', appState);

	onMount(async () => {
		// Use local storage is present & valid, otherwise default to max TH
		const savedTownHall = +(localStorage.getItem('townHall') ?? '??');
		appState.townHall = !Number.isNaN(savedTownHall) ? savedTownHall : data.townHalls.length;
	});

	function openTownHallSelector() {
		if (appState.townHall === null) {
			return;
		}
		appState.openModal(C.TownHallSelector, { appState });
	}

	function toggleDevDebug() {
		devDebugOpen = !devDebugOpen;
	}

	function popModal() {
		appState.modals.pop();
		requireHTML().classList.remove('hide-overflow');
	}

	function openChangelog() {
		// TODO: add changelog modal
	}
</script>

<nav>
	<div class="container">
		<div class="left">
			<div class="logo-container">
				<a class="logo" href="/">
					<img src="/clash/ui/swords.png" alt="Clash of clans overlapping swords" />
					Clash <span>Armies</span>
				</a>
				<button class="version" onclick={openChangelog}><span>v</span>{version}</button>
			</div>
			<ul class="links">
				<li>
					<a class="body" href="/armies">Armies</a>
				</li>
				{#if appState.user}
					<li>
						<a class="body" href="/create">Create</a>
					</li>
				{/if}
			</ul>
		</div>
		<ul class="links">
			{#if appState.user && appState.user.hasRoles('admin')}
				<li>
					<a class="body" href="/admin">Admin</a>
				</li>
			{/if}
			{#if appState.user}
				<li>
					<a class="body" href="/users/{appState.user.username}">Account</a>
				</li>
			{/if}
			<li class="control">
				{#if appState.user}
					<C.Link href="/logout">Log out</C.Link>
				{:else}
					<C.Link href="/login">Log in</C.Link>
				{/if}
			</li>
			{#if appState.user}
				<li class="control">
					<C.TownHall level={appState.townHall} onclick={openTownHallSelector} --width="80px" />
				</li>
			{/if}
		</ul>
	</div>
</nav>

{@render children()}

{#if appState.modals.length}
	<div class="modals-container" transition:fade={{ duration: 150, easing: sineInOut }}>
		<button class="modal-backdrop" type="button" onclick={popModal} />
		{#each appState.modals as modal}
			<svelte:component this={modal.component} {...modal.props} />
		{/each}
	</div>
{/if}

{#if import.meta.env.DEV}
	<div class="dev-debug-container" class:open={devDebugOpen}>
		<div class="dev-debug">
			<b>DEBUG</b>
			<p>• Town hall <span>{appState.townHall}</span></p>
			<p>• Barrack <span>{appState.barrack}</span></p>
			<p>• Dark barrack <span>{appState.darkBarrack}</span></p>
			<p>• Laboratory <span>{appState.laboratory}</span></p>
			<p>• Spell factory <span>{appState.spellFactory}</span></p>
			<p>• Dark spell factory <span>{appState.darkSpellFactory}</span></p>
			<p>• Workshop <span>{appState.workshop}</span></p>
		</div>
		<button class="toggle-open" onclick={toggleDevDebug}>
			{'>'}
		</button>
	</div>
{/if}

<style>
	nav {
		background-color: var(--grey-800);
		padding: 16px var(--side-padding);
	}

	nav .container {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1em;
	}

	.left {
		display: flex;
		align-items: center;
		gap: 24px;
	}

	.logo-container {
		display: flex;
		align-items: center;
		gap: 0.3em;
	}

	.version {
		display: block;
		outline: none;
		background: none;
		border: 1px dashed var(--primary-400);
		color: var(--primary-400);
		padding: 4px 7px;
		border-radius: 50px;
		font-weight: 700;
		font-size: 10px;
		line-height: 10px;
		transition:
			background-color,
			color 0.15s;
	}

	.version span {
		display: inline-block;
		font-size: 10px;
	}

	.logo {
		display: flex;
		align-items: center;
	}

	.logo,
	.logo span {
		color: var(--grey-100);
		font-family: 'Clash', sans-serif;
		font-weight: 700;
		font-size: 20px;
	}

	.logo span {
		color: var(--primary-400);
	}

	.logo img {
		/** Optical alignment */
		position: relative;
		bottom: 1.5px;
		/* Rest */
		margin-right: 0.25em;
		max-height: 32px;
		height: 100%;
		width: auto;
	}

	.links {
		display: flex;
		align-items: center;
	}

	.links li:not(:last-child) {
		margin-right: 16px;
	}

	.links li.control:not(:last-child) {
		margin-right: 8px;
	}

	.links li a {
		transition: color 0.15s ease-in-out;
		color: var(--grey-400);
	}

	.links li a:hover {
		color: var(--grey-300);
	}

	.modal-backdrop {
		background-color: hsla(0, 0%, 0%, 0.7);
		backdrop-filter: blur(10px);
		position: fixed;
		height: 100%;
		width: 100%;
		bottom: 0;
		left: 0;
	}

	.dev-debug-container {
		position: fixed;
		display: flex;
		align-items: center;
		transition: transform 0.1s ease-in-out;
		transform: translateY(-50%) translateX(calc(-100% + 20px));
		top: 50%;
		left: 0;
	}

	.dev-debug-container.open {
		transform: translateY(-50%) translateX(0);
	}

	.dev-debug-container .toggle-open {
		color: var(--grey-100);
		background-color: var(--grey-900);
		border-radius: 0 4px 4px 0;
		border-left: 1px solid var(--grey-600);
		padding: 6px 0;
		width: 20px;
	}

	.dev-debug {
		border-radius: 0 8px 8px 0;
		background-color: var(--grey-900);
		padding: 1em;
	}

	.dev-debug b {
		display: block;
		color: var(--grey-100);
		padding-bottom: 0.4em;
		margin-bottom: 0.6em;
		border-bottom: 1px solid var(--grey-700);
	}

	.dev-debug p {
		display: flex;
		justify-content: space-between;
		align-items: center;
		color: var(--grey-100);
		font-weight: 500;
		font-size: 1em;
		gap: 0.75em;
	}

	.dev-debug p span {
		color: var(--grey-500);
	}

	.dev-debug p:not(:last-child) {
		margin-bottom: 0.5em;
	}
</style>
