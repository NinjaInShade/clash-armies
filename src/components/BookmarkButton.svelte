<script lang="ts">
	import { getContext } from 'svelte';
	import type { AppState } from '$types';
	import type { ArmyModel } from '$models';
	import { invalidate } from '$app/navigation';

	type Props = {
		model: ArmyModel;
	};
	const { model }: Props = $props();
	const app = getContext<AppState>('app');

	let bookmarked = $state<boolean>(model.userBookmarked);
	let savingBookmark = $state<boolean>(false);

	async function saveBookmark(removing: boolean) {
		savingBookmark = true;
		try {
			if (removing) {
				await app.http.delete('/api/armies/bookmarks', { armyId: model.id });
			} else {
				await app.http.post('/api/armies/bookmarks', { armyId: model.id });
			}
		} catch {
			app.notify({
				title: 'Failed action',
				description: `There was a problem ${removing ? 'unsaving' : 'saving'} this army`,
				theme: 'failure',
			});
			return;
		} finally {
			savingBookmark = false;
		}

		bookmarked = !bookmarked;
		if (!removing) {
			app.notify({ title: `Saved army`, description: 'View saved armies on your account page', theme: 'success' });
		}
		await invalidate('ca:savedArmies');
	}
</script>

<button
	class="bookmark {bookmarked ? 'bookmarked' : ''} focus-grey"
	onclick={() => saveBookmark(bookmarked)}
	disabled={savingBookmark}
	title={bookmarked ? 'Remove this army from saved' : 'Save this army - you can view all saved armies on your account page'}
	aria-label={bookmarked ? 'Remove this army from saved' : 'Save this army - you can view all saved armies on your account page'}
>
	<svg width="11.7" height="15" viewBox="0 0 10 12" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path
			d="M0 12V1.33333C0 0.966667 0.130667 0.652889 0.392 0.392C0.653333 0.131111 0.967111 0.000444444 1.33333 0H8C8.36667 0 8.68067 0.130667 8.942 0.392C9.20333 0.653333 9.33378 0.967111 9.33333 1.33333V12L4.66667 10L0 12Z"
			fill={bookmarked ? 'var(--primary-400)' : 'var(--grey-300)'}
		/>
	</svg>
</button>

<style>
	.bookmark svg {
		display: block;
	}
	.bookmark path {
		transition: fill 0.1s ease-in-out;
	}
	.bookmark:not(.bookmarked):not(:disabled):hover path {
		fill: var(--grey-100);
	}
</style>
