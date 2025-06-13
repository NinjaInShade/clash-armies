<script lang="ts">
	import { getContext } from 'svelte';
	import type { AppState } from '$types';
	import { ArmyModel } from '$models';
	import { copyLink, getCopyBtnTitle } from '$client/army';
	import { invalidate, invalidateAll, goto } from '$app/navigation';
	import Menu from './Menu.svelte';

	type Props = {
		model: ArmyModel;
		menuOpen: boolean;
		menuBtnRef: HTMLElement;
		hideViewArmyLink?: boolean;
	};
	let { model, menuOpen = $bindable(false), menuBtnRef = $bindable(), hideViewArmyLink = false }: Props = $props();

	const app = getContext<AppState>('app');

	const bookmarked = $derived(model.userBookmarked);

	async function copy() {
		try {
			await copyLink(model, app);
		} catch {
			app.notify({ title: 'Failed to copy', description: 'There was a problem copying the game link', theme: 'failure' });
		} finally {
			menuOpen = false;
		}
	}

	async function saveBookmark() {
		const removing = model.userBookmarked;
		model.userBookmarked = !model.userBookmarked;
		try {
			if (removing) {
				await app.http.delete('/api/armies/bookmarks', model.id);
			} else {
				await app.http.post('/api/armies/bookmarks', model.id);
			}
		} catch {
			app.notify({
				title: 'Failed action',
				description: `There was a problem ${removing ? 'unsaving' : 'saving'} this army`,
				theme: 'failure',
			});
		} finally {
			menuOpen = false;
		}
		if (!removing) {
			app.notify({ title: `Saved army`, description: 'View saved armies on your account page', theme: 'success' });
		}
		await invalidate('ca:savedArmies');
	}

	async function deleteArmy() {
		const confirmed = await app.confirm('Are you sure you want to delete this army warrior? This cannot be undone!');
		if (!confirmed) {
			return;
		}

		try {
			await app.http.delete('/api/armies', model.id);
		} catch (err) {
			app.notify({
				title: 'Failed action',
				description: `There was a problem deleting this army`,
				theme: 'failure',
			});
			return;
		}

		await goto(`/armies`);
		await invalidateAll();
	}
</script>

<Menu bind:open={menuOpen} elRef={menuBtnRef} placementOffset={12} --menu-width="175px">
	<div class="ca-menu">
		<ul class="ca-menu-list">
			{#if !hideViewArmyLink}
				<li>
					<a href="/armies/{model.id}">
						<svg viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
							<path
								d="M7.99959 0C7.73438 0 7.48002 0.105357 7.29249 0.292893C7.10495 0.48043 6.99959 0.734784 6.99959 1C6.99959 1.26522 7.10495 1.51957 7.29249 1.70711C7.48002 1.89464 7.73438 2 7.99959 2H10.5856L4.29259 8.293C4.19708 8.38525 4.1209 8.49559 4.06849 8.6176C4.01608 8.7396 3.9885 8.87082 3.98734 9.0036C3.98619 9.13638 4.01149 9.26806 4.06177 9.39095C4.11205 9.51385 4.18631 9.6255 4.2802 9.71939C4.37409 9.81329 4.48574 9.88754 4.60864 9.93782C4.73154 9.9881 4.86321 10.0134 4.99599 10.0123C5.12877 10.0111 5.25999 9.98351 5.382 9.9311C5.504 9.87869 5.61435 9.80251 5.70659 9.707L11.9996 3.414V6C11.9996 6.26522 12.1049 6.51957 12.2925 6.70711C12.48 6.89464 12.7344 7 12.9996 7C13.2648 7 13.5192 6.89464 13.7067 6.70711C13.8942 6.51957 13.9996 6.26522 13.9996 6V1C13.9996 0.734784 13.8942 0.48043 13.7067 0.292893C13.5192 0.105357 13.2648 0 12.9996 0H7.99959Z"
								fill="currentColor"
							/>
							<path
								d="M2 2C1.46957 2 0.960859 2.21071 0.585786 2.58579C0.210714 2.96086 0 3.46957 0 4V12C0 12.5304 0.210714 13.0391 0.585786 13.4142C0.960859 13.7893 1.46957 14 2 14H10C10.5304 14 11.0391 13.7893 11.4142 13.4142C11.7893 13.0391 12 12.5304 12 12V9C12 8.73478 11.8946 8.48043 11.7071 8.29289C11.5196 8.10536 11.2652 8 11 8C10.7348 8 10.4804 8.10536 10.2929 8.29289C10.1054 8.48043 10 8.73478 10 9V12H2V4H5C5.26522 4 5.51957 3.89464 5.70711 3.70711C5.89464 3.51957 6 3.26522 6 3C6 2.73478 5.89464 2.48043 5.70711 2.29289C5.51957 2.10536 5.26522 2 5 2H2Z"
								fill="currentColor"
							/>
						</svg>
						View army
					</a>
				</li>
			{/if}

			<li>
				<button
					onclick={copy}
					disabled={!model.units.length && !model.ccUnits.length && !model.pets.length && !model.equipment.length}
					title={getCopyBtnTitle(model)}
				>
					<svg viewBox="0 0 16 17" xmlns="http://www.w3.org/2000/svg">
						<path
							d="M3.4 3.4V0.849999C3.4 0.624565 3.48955 0.408365 3.64896 0.248959C3.80836 0.0895532 4.02456 0 4.25 0H14.45C14.6754 0 14.8916 0.0895532 15.051 0.248959C15.2104 0.408365 15.3 0.624565 15.3 0.849999V12.75C15.3 12.9754 15.2104 13.1916 15.051 13.351C14.8916 13.5104 14.6754 13.6 14.45 13.6H11.9V16.15C11.9 16.6192 11.5175 17 11.044 17H0.855949C0.743857 17.0007 0.632737 16.9792 0.528974 16.9368C0.42521 16.8944 0.330848 16.8319 0.25131 16.7529C0.171771 16.6739 0.108624 16.58 0.0654961 16.4765C0.0223682 16.373 0.000109968 16.2621 0 16.15L0.00255002 4.25C0.00255002 3.7808 0.38505 3.4 0.857649 3.4H3.4ZM1.7017 5.1L1.7 15.3H10.2V5.1H1.7017ZM5.1 3.4H11.9V11.9H13.6V1.7H5.1V3.4ZM3.4 7.64999H8.49999V9.34999H3.4V7.64999ZM3.4 11.05H8.49999V12.75H3.4V11.05Z"
							fill="currentColor"
						/>
					</svg>
					Copy game link
				</button>
			</li>

			{#if app.user}
				<li>
					<button
						class="bookmark-btn"
						class:bookmarked
						onclick={saveBookmark}
						title={bookmarked ? 'Remove this army from saved' : 'Save this army - you can view all saved armies on your account page'}
						aria-label={bookmarked ? 'Remove this army from saved' : 'Save this army - you can view all saved armies on your account page'}
					>
						<svg viewBox="0 0 10 12" xmlns="http://www.w3.org/2000/svg">
							<path
								d="M0 12V1.33333C0 0.966667 0.130667 0.652889 0.392 0.392C0.653333 0.131111 0.967111 0.000444444 1.33333 0H8C8.36667 0 8.68067 0.130667 8.942 0.392C9.20333 0.653333 9.33378 0.967111 9.33333 1.33333V12L4.66667 10L0 12Z"
								fill="currentColor"
							/>
						</svg>
						{model.userBookmarked ? 'Unsave' : 'Save'} army
					</button>
				</li>

				{#if app.user.id === model.createdBy || app.user.hasRoles('admin')}
					<li>
						<a href="/armies/edit/{model.id}">
							<svg viewBox="0 0 16 17" xmlns="http://www.w3.org/2000/svg">
								<path
									d="M13.4719 0.012207L15.9998 2.54015L14.0727 4.46812L11.5448 1.94018L13.4719 0.012207ZM4.21289 11.7991H6.74083L12.8812 5.65878L10.3533 3.13084L4.21289 9.27121V11.7991Z"
									fill="currentColor"
								/>
								<path
									d="M13.4823 14.3271H4.34637C4.32446 14.3271 4.30171 14.3355 4.2798 14.3355C4.252 14.3355 4.22419 14.3279 4.19554 14.3271H1.68529V2.53002H7.4549L9.14019 0.844727H1.68529C0.755854 0.844727 0 1.59974 0 2.53002V14.3271C0 15.2574 0.755854 16.0124 1.68529 16.0124H13.4823C13.9293 16.0124 14.358 15.8348 14.674 15.5188C14.9901 15.2027 15.1676 14.774 15.1676 14.3271V7.02301L13.4823 8.7083V14.3271Z"
									fill="currentColor"
								/>
							</svg>
							Edit army
						</a>
					</li>
					<li>
						<button onclick={deleteArmy}>
							<svg viewBox="0 0 12 16" xmlns="http://www.w3.org/2000/svg">
								<path
									d="M12 0.888889H9L8.14286 0H3.85714L3 0.888889H0V2.66667H12M0.857143 14.2222C0.857143 14.6937 1.03775 15.1459 1.35925 15.4793C1.68074 15.8127 2.11677 16 2.57143 16H9.42857C9.88323 16 10.3193 15.8127 10.6408 15.4793C10.9622 15.1459 11.1429 14.6937 11.1429 14.2222V3.55556H0.857143V14.2222Z"
									fill="currentColor"
								/>
							</svg>
							Delete army
						</button>
					</li>
				{/if}
			{/if}
		</ul>
	</div>
</Menu>

<style>
	.bookmark-btn {
		&.bookmarked {
			color: var(--primary-400);
		}
	}
</style>
