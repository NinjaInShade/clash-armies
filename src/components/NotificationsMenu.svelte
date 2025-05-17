<script lang="ts">
	import type { AppState, ArmyNotification } from '$types';
	import { getContext } from 'svelte';
	import { intlFormatDistance } from 'date-fns';
	import { invalidateAll, goto } from '$app/navigation';
	import Menu from './Menu.svelte';
	import FocusTrap from './FocusTrap.svelte';

	type Props = {
		open: boolean;
		elRef: HTMLElement | undefined;
	};
	let { open = $bindable(), elRef }: Props = $props();

	const app = getContext<AppState>('app');
	const notifications = $derived(app.user?.notifications ?? []);

	async function markAsRead(notificationIds: number[]) {
		try {
			await app.http.post('/api/notifications', notificationIds);
		} catch {
			app.notify({
				title: 'Failed action',
				description: `There was a problem acknowledging this notification`,
				theme: 'failure',
			});
			return;
		}

		await invalidateAll();
	}

	function markAllAsRead() {
		const ids = notifications.map((notif) => notif.id);
		return markAsRead(ids);
	}

	async function openNotification(notification: ArmyNotification) {
		if (!notification.seen) {
			await markAsRead([notification.id]);
		}
		if (['comment', 'comment-reply'].includes(notification.type)) {
			await goto(`/armies/${notification.armyId}#comment-${notification.commentId}`);
		}
	}

	function formatTime(notificationTime: Date) {
		// Add a second as otherwise time will read as "In 0 secs"
		const now = Date.now() + 1000;
		return intlFormatDistance(notificationTime, now, { style: 'short', numeric: 'always' });
	}
</script>

<Menu bind:open {elRef}>
	<FocusTrap>
		<div class="menu-container">
			<header>
				<h3>Notifications {notifications.length ? `(${notifications.length})` : ''}</h3>
				{#if notifications.filter((notif) => !notif.seen).length > 0}
					<button onclick={markAllAsRead}>Mark all as read</button>
				{/if}
			</header>
			{#each notifications as notif (notif.id)}
				<div class="notification">
					<img src="/clash/ui/barbarian.png" alt="Clash of clans barbarian" />
					<div class="notification-content">
						<button onclick={() => openNotification(notif)} class="notification-title" class:seen={notif.seen}>
							{#if notif.type === 'comment'}
								{notif.triggeringUserName} commented on your army "{notif.armyName}"
							{:else if notif.type === 'comment-reply'}
								{notif.triggeringUserName} replied to your comment on "{notif.armyName}"
							{/if}
						</button>
						<footer>
							<span class="notification-text">{formatTime(notif.timestamp)}</span>
							{#if !notif.seen}
								<span class="circle"></span>
								<button onclick={() => markAsRead([notif.id])} class="notification-text">Mark as read</button>
							{/if}
						</footer>
					</div>
				</div>
			{:else}
				<p class="no-notifications">You have no new notifications warrior</p>
			{/each}
		</div>
	</FocusTrap>
</Menu>

<style>
	.menu-container {
		background-color: var(--grey-900);
		border: 1px dashed var(--grey-500);
		box-shadow: 0 7px 100px 0 hsla(0, 0%, 0%, 0.25);
		border-radius: 6px;
		max-height: 90dvh; /** TODO: hack... */
		overflow-y: auto;
		max-width: 350px;
		width: 100%;
	}

	.menu-container > *:last-child {
		border-radius: 0 0 6px 6px;
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background-color: var(--grey-900);
		border-bottom: 1px dashed var(--grey-500);
		padding: 12px 16px;
		position: sticky;
		top: 0;
	}

	header h3,
	header button,
	.no-notifications {
		font-size: var(--fs-sm);
		line-height: var(--fs-sm-lh);
	}

	header h3 {
		font-family: 'Poppins', sans-serif;
		color: var(--grey-100);
		font-weight: 500;
	}

	header button {
		color: var(--grey-400);
	}

	header button:hover {
		color: var(--grey-100);
	}

	.notification,
	.no-notifications {
		display: flex;
		align-items: flex-start;
		background-color: var(--grey-850);
		padding: 12px 16px;
		gap: 10px;
	}

	.no-notifications {
		justify-content: center;
		color: var(--grey-400);
	}

	.notification:not(:last-child) {
		border-bottom: 1px solid var(--grey-600);
	}

	.notification-content footer {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		margin-top: 4px;
		gap: 6px;
	}

	.notification-title {
		display: block;
		text-align: left;
		font-size: 12px;
		line-height: 16px;
		color: var(--grey-100);
	}

	.notification-title.seen {
		color: var(--grey-400);
	}

	.notification-text {
		font-size: 12px;
		line-height: 14px;
		color: var(--grey-400);
	}

	.notification-content .circle {
		background-color: var(--grey-400);
		border-radius: 50%;
		height: 4px;
		width: 4px;
	}

	.notification-content button:hover {
		color: var(--grey-100);
	}

	.notification img {
		background-color: var(--primary-400);
		border-radius: 50%;
		max-width: 36px;
		width: 100%;
	}
</style>
