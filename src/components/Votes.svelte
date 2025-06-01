<script lang="ts">
	import { getContext } from 'svelte';
	import type { AppState } from '$types';
	import type { ArmyModel } from '$models';
	import { debounce } from '$shared/utils';

	type Props = {
		model: ArmyModel;
		size?: 'regular' | 'large';
	};
	const { model, size = 'regular' }: Props = $props();
	const app = getContext<AppState>('app');

	// Intentionally not reactive
	const originalVotes = model.votes;
	const countLabel = $derived(originalVotes ? model.votes : 'Vote');

	const saveVote = debounce(async function () {
		try {
			const data = { armyId: model.id, vote: model.userVote };
			await app.http.post('/api/armies/votes', data);
		} catch {
			app.notify({
				title: 'Failed action',
				description: `There was a problem saving your vote`,
				theme: 'failure',
			});
		}
	}, 150);

	async function vote(userVote: number) {
		if (!app.user) {
			await app.requireAuth();
			return;
		}
		model.userVote = userVote;
		model.votes = originalVotes + userVote;
		await saveVote();
	}

	async function downvote() {
		await vote(-1);
	}

	async function upvote() {
		await vote(1);
	}

	async function clearVote() {
		await vote(0);
	}

	function getClass(userVote: number) {
		if (userVote === 1) {
			return 'upvoted';
		}
		if (userVote === -1) {
			return 'downvoted';
		}
		return '';
	}
</script>

<div class="utility-btn vote {getClass(model.userVote)} {size}">
	<button class="focus-grey upvote-btn" aria-label="Upvote" onclick={model.userVote === 1 ? clearVote : upvote}>
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 13 12">
			<path
				d="M0 5.77778H2.32143V12H0V5.77778ZM9.75 12H3.25V5.42089L4.66236 3.39289L5.05468 0.763111C5.08723 0.551606 5.19794 0.35829 5.36671 0.218267C5.53547 0.0782446 5.7511 0.000801115 5.97443 0H6.03571C6.40501 0.000352984 6.75907 0.140942 7.02021 0.390914C7.28134 0.640886 7.4282 0.97982 7.42857 1.33333V4H11.1429C11.6352 4.00059 12.1072 4.18808 12.4554 4.52135C12.8035 4.85462 12.9994 5.30646 13 5.77778V8.88889C12.999 9.71372 12.6563 10.5045 12.047 11.0877C11.4377 11.671 10.6117 11.9991 9.75 12Z"
				fill="currentColor"
			/>
		</svg>
		<span class="vote-count" style="min-width: {String(originalVotes).length}ch">
			{countLabel}
		</span>
	</button>
	<div class="separator"></div>
	<button class="focus-grey downvote-btn" aria-label="Downvote" onclick={model.userVote === -1 ? clearVote : downvote}>
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 13 12">
			<path
				d="M0 0H2.32143V6.22222H0V0ZM9.75 0H3.25V6.57911L4.66236 8.60711L5.05468 11.2369C5.08723 11.4484 5.19794 11.6417 5.36671 11.7817C5.53547 11.9218 5.7511 11.9992 5.97443 12H6.03571C6.40501 11.9996 6.75907 11.8591 7.02021 11.6091C7.28134 11.3591 7.4282 11.0202 7.42857 10.6667V8H11.1429C11.6352 7.99941 12.1072 7.81192 12.4554 7.47865C12.8035 7.14538 12.9994 6.69354 13 6.22222V3.11111C12.999 2.28628 12.6563 1.49551 12.047 0.912263C11.4377 0.32902 10.6117 0.00094105 9.75 0Z"
				fill="currentColor"
			/>
		</svg>
	</button>
</div>

<style>
	.vote {
		padding: 0;
		gap: 0;

		&:hover {
			background-color: var(--_bg-clr);
		}

		& .upvote-btn {
			display: flex;
			align-items: center;
			color: var(--grey-100);
			padding: var(--pad) var(--gap) var(--pad) var(--pad);
			border-radius: var(--br) 0 0 var(--br);
			gap: 6px;

			&:hover {
				background-color: var(--_bg-clr-hover);
			}

			& .vote-count {
				text-transform: uppercase;
				white-space: nowrap;
				font-weight: 700;
				font-size: var(--fs);
				line-height: var(--fs);
			}
		}

		& .downvote-btn {
			color: var(--grey-100);
			padding: var(--pad) var(--pad) var(--pad) var(--gap);
			border-radius: 0 var(--br) var(--br) 0;

			&:hover {
				background-color: var(--_bg-clr-hover);
			}
		}

		&.upvoted .upvote-btn {
			color: var(--upvote);
		}

		&.downvoted .downvote-btn,
		&.downvoted .vote-count {
			color: var(--downvote);
		}

		& .separator {
			width: 0px;
			height: max-content;
			border-left: 1px dashed var(--grey-500);
			padding: var(--pad) 0;
		}
	}
</style>
