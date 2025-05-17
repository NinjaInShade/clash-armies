<script lang="ts">
	import { fade } from 'svelte/transition';
	import { sineInOut } from 'svelte/easing';
	import { setContext, type Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import { createAppState } from '$client/state.svelte';
	import { invalidateAll } from '$app/navigation';
	import type { AppState, ArmyNotification } from '$types';
	import C from '$components';

	type Props = {
		data: LayoutData;
		children: Snippet;
	};
	let { data, children }: Props = $props();

	const alerts = [];

	async function ackArmyNotification(notification: ArmyNotification) {
		try {
			const data = { ...notification, seen: true };
			await appState.http.post('/api/notifications', data);
		} catch {
			appState.notify({
				title: 'Failed action',
				description: 'There was a problem acknowledging this notification',
				theme: 'failure',
			});
			return;
		}

		await invalidateAll();
	}

	/** Extends user to include properties AppState needs */
	function extendUser(user: LayoutData['user'], userNotifications: LayoutData['userNotifications']): AppState['user'] {
		if (!user) {
			return null;
		}

		const notifications = (userNotifications ?? []).map((notif) => {
			return {
				...notif,
				dismiss() {
					return ackArmyNotification(notif);
				},
			};
		});

		return {
			...user,
			notifications,
			hasRoles(...roles: string[]) {
				return roles.every((role) => user.roles.includes(role));
			},
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
		user: extendUser(data.user, data.userNotifications),
	});
	setContext('app', appState);

	$effect(() => {
		// If layout data is invalidated, update app store
		appState.units = data.units;
		appState.townHalls = data.townHalls;
		appState.equipment = data.equipment;
		appState.pets = data.pets;
		appState.user = extendUser(data.user, data.userNotifications);
	});

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
		{#each appState.modals as modal, idx (modal.id)}
			{#if idx === appState.modals.length - 1}
				<!-- Render backdrop behind the last modal in case multiple nested modals are opened -->
				<button class="modal-backdrop" type="button" onclick={popModal} aria-label="Close modal"></button>
			{/if}
			<modal.component {...modal.props} />
		{/each}
	</div>
{/if}

<div class="toasts-container">
	{#each appState.notifications as notification (notification.id)}
		<C.Toast {...notification.opts} dismiss={notification.dismiss} />
	{/each}
</div>

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
		--mask: linear-gradient(to top, rgba(0, 0, 0, 1) 0, rgba(0, 0, 0, 1) 85%, rgba(0, 0, 0, 0) 95%, rgba(0, 0, 0, 0) 0) 100% 50% / 100% 100% repeat-x;
		-webkit-mask: var(--mask);
		mask: var(--mask);
		/** So padding-right isn't less when there's a scrollbar */
		scrollbar-gutter: stable;
	}

	.alerts {
		padding: 24px var(--side-padding);
	}

	@media (max-width: 450px) {
		.toasts-container {
			padding: 8px;
		}
	}
</style>
