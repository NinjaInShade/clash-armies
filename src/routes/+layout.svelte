<script lang="ts">
	import { fade } from 'svelte/transition';
	import { sineInOut } from 'svelte/easing';
	import { onMount, setContext, type Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import { createAppState, requireHTML } from '~/lib/state.svelte';
	import C from '~/components';

	type Props = {
		data: LayoutData;
		children: Snippet;
	};
	let { data, children } = $props<Props>();

	let devDebugOpen: boolean = $state(false);

	/**
	 * Due to first render being SSR, any state that will be overridden by localStorage onMount
	 * should start as null and consumers should show loading animations until the values are set.
	 */
	const appState = createAppState({
		// frequently used data (cache)
		troops: data.troops,
		sieges: data.sieges,
		spells: data.spells,
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
		modals: []
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
</script>

<nav>
	<div class="container">
		<a class="logo" href="/">
			<img src="/clash/ui/swords.png" alt="Clash of clans overlapping swords" />
			Clash <span>Armies</span>
		</a>
		<ul class="links">
			<li>
				<a class="body" href="/armies">Find</a>
			</li>
			<li>
				<a class="body" href="/create">Create</a>
			</li>
			<li>
				<a class="body" href="/account">Account</a>
			</li>
			<li class="control">
				<C.Button>Log in</C.Button>
			</li>
			<li class="control">
				<C.TownHall level={appState.townHall} onclick={openTownHallSelector} --width="80px" />
			</li>
		</ul>
	</div>
</nav>

{@render children()}

{#if appState.modals.length}
	<div transition:fade={{ duration: 150, easing: sineInOut }}>
		<button class="modal-backdrop" on:click={popModal} />
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
		margin-right: 24px;
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
