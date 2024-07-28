<script lang="ts">
	import { fade } from 'svelte/transition';
	import { sineInOut } from 'svelte/easing';
	import { setContext, type Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import { createAppState, requireHTML } from '~/lib/client/state.svelte';
	import type { AppState } from '~/lib/shared/types';
	import C from '~/components';

	type Props = {
		data: LayoutData;
		children: Snippet;
	};
	let { data, children }: Props = $props();

	const alerts = [];

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
		// Frequently used data (cache)
		units: data.units,
		townHalls: data.townHalls,
		equipment: data.equipment,
		pets: data.pets,
		user: extendUser(data.user)
	});
	setContext('app', appState);

	$effect(() => {
		// If layout data is invalidated, update app store
		appState.units = data.units;
		appState.townHalls = data.townHalls;
		appState.equipment = data.equipment;
		appState.pets = data.pets;
		appState.user = extendUser(data.user);
	});

	function toggleDevDebug() {
		devDebugOpen = !devDebugOpen;
	}

	function popModal() {
		const lastModal = appState.modals.at(-1);
		if (!lastModal) {
			return;
		}
		lastModal.props.close();
	}
</script>

<C.Nav />

{#if alerts.length}
	<div class="alerts">
		<div class="container">
			<!-- TODO -->
		</div>
	</div>
{/if}

{@render children()}

<C.Footer />

{#if appState.modals.length}
	<div class="modals-container" transition:fade={{ duration: 150, easing: sineInOut }}>
		<button class="modal-backdrop" type="button" onclick={popModal}></button>
		{#each appState.modals as modal}
			<svelte:component this={modal.component} {...modal.props} />
		{/each}
	</div>
{/if}

<div class="toasts-container">
	{#each appState.notifications as notification (notification.id)}
		<C.Toast {...notification.opts} dismiss={notification.dismiss} />
	{/each}
</div>

{#if import.meta.env.DEV}
	<div class="dev-debug-container" class:open={devDebugOpen}>
		<div class="dev-debug">
			<b>DEBUG</b>
			<p>• TODO <span>...</span></p>
		</div>
		<button class="toggle-open" onclick={toggleDevDebug}>
			{'>'}
		</button>
	</div>
{/if}

<style>
	.modals-container {
		z-index: 4;
	}

	.modal-backdrop {
		background-color: hsla(0, 0%, 0%, 0.7);
		/** Use svelte blur transition? */ 
		backdrop-filter: blur(10px);
		position: fixed;
		height: 100%;
		width: 100%;
		bottom: 0;
		left: 0;
	}

	.toasts-container {
		position: fixed;
		display: flex;
		flex-flow: column nowrap;
		align-items: flex-end;
		justify-content: flex-end;
		padding: 12px;
		bottom: 0;
		right: 0;
		z-index: 4;
		gap: 0.5em;
		overflow-y: hidden;
		max-height: 85vh;
		max-width: 475px;
		height: 100%;
		width: 100%;
		pointer-events: none;
		--mask: linear-gradient(to top, 
		    rgba(0,0,0, 1) 0,   
		    rgba(0,0,0, 1) 85%, 
		    rgba(0,0,0, 0) 95%, 
		    rgba(0,0,0, 0) 0
		) 100% 50% / 100% 100% repeat-x;
		-webkit-mask: var(--mask); 
		mask: var(--mask);
		/** So padding-right isn't less when there's a scrollbar */
		scrollbar-gutter: stable;
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

	.alerts {
		padding: 24px var(--side-padding);
	}

	@media(max-width: 450px) {
		.toasts-container {
			padding: 8px;
		}
	}
</style>
