<script lang="ts">
	import { getContext } from 'svelte';
	import type { AppState } from '$types';
	import type { ArmyComment } from '$models';
	import { invalidateAll } from '$app/navigation';
	import Menu from './Menu.svelte';

	type Props = {
		editComment: () => Promise<void>;
		comment: ArmyComment;
		menuOpen: boolean;
		menuBtnRef: HTMLElement | undefined;
	};
	let { editComment, comment, menuOpen = $bindable(false), menuBtnRef = $bindable() }: Props = $props();

	const app = getContext<AppState>('app');

	async function deleteComment() {
		const confirmed = await app.confirm('Are you sure you want to delete this comment?');
		if (!confirmed) return;

		try {
			await app.http.delete('/api/armies/comments', comment.id);
		} catch {
			app.notify({
				title: 'Failed action',
				description: `There was a problem deleting this comment`,
				theme: 'failure',
			});
			return;
		} finally {
			menuOpen = false;
		}

		await invalidateAll();
	}

	async function setEditingMode() {
		await editComment();
		menuOpen = false;
	}
</script>

<Menu bind:open={menuOpen} elRef={menuBtnRef} placementOffset={12} --menu-width="175px">
	<div class="ca-menu">
		<ul class="ca-menu-list">
			<li>
				<button onclick={setEditingMode}>
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
					Edit comment
				</button>
			</li>
			<li>
				<button onclick={deleteComment}>
					<svg viewBox="0 0 12 16" xmlns="http://www.w3.org/2000/svg">
						<path
							d="M12 0.888889H9L8.14286 0H3.85714L3 0.888889H0V2.66667H12M0.857143 14.2222C0.857143 14.6937 1.03775 15.1459 1.35925 15.4793C1.68074 15.8127 2.11677 16 2.57143 16H9.42857C9.88323 16 10.3193 15.8127 10.6408 15.4793C10.9622 15.1459 11.1429 14.6937 11.1429 14.2222V3.55556H0.857143V14.2222Z"
							fill="currentColor"
						/>
					</svg>
					Delete comment
				</button>
			</li>
		</ul>
	</div>
</Menu>
