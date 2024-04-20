<script lang="ts">
	type Props = {
		votes: number;
		userVote: 'upvoted' | 'downvoted' | null;
	};
	let { votes, userVote } = $props<Props>();

	function getClass(votes: number) {
		if (votes > 0) {
			return 'upvote';
		}
		if (votes < 0) {
			return 'downvote';
		}
		return '';
	}

	function downvote() {
		votes -= userVote ? 2 : 1;
		userVote = 'downvoted';
	}

	function upvote() {
		votes += userVote ? 2 : 1;
		userVote = 'upvoted';
	}

	function clearVote() {
		votes += userVote === 'downvoted' ? 1 : -1;
		userVote = null;
	}
</script>

<div class="vote">
	<button onclick={userVote === 'downvoted' ? clearVote : downvote}>
		<svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M0 0H2.9932V8.2963H0V0ZM12.5714 0H4.19048V8.77215L6.01154 11.4761L6.51739 14.9825C6.55936 15.2645 6.70211 15.5223 6.91971 15.709C7.13731 15.8957 7.41533 15.9989 7.70329 16H7.78231C8.25847 15.9995 8.715 15.8121 9.05169 15.4788C9.38839 15.1455 9.57775 14.6936 9.57823 14.2222V10.6667H14.3673C15.0022 10.6659 15.6108 10.4159 16.0597 9.97153C16.5086 9.52717 16.7611 8.92472 16.7619 8.2963V4.14815C16.7606 3.04838 16.3187 1.99401 15.5331 1.21635C14.7476 0.438694 13.6824 0.00125473 12.5714 0Z"
				fill={userVote === 'downvoted' ? 'var(--downvote)' : '#666'}
			/>
		</svg>
	</button>
	<b class={getClass(votes)}>{Math.abs(votes)}</b>
	<button onclick={userVote === 'upvoted' ? clearVote : upvote}>
		<svg width="18" height="16" viewBox="0 0 18 16" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M0 7.7037H3.07692V16H0V7.7037ZM12.9231 16H4.30769V7.22785L6.17969 4.52385L6.69969 1.01748C6.74284 0.735475 6.88958 0.47772 7.11327 0.291023C7.33696 0.104326 7.62276 0.00106815 7.91877 0H8C8.48948 0.000470646 8.95877 0.187923 9.30489 0.521219C9.651 0.854515 9.84567 1.30643 9.84615 1.77778V5.33333H14.7692C15.4218 5.33412 16.0475 5.5841 16.5089 6.02847C16.9704 6.47283 17.23 7.07528 17.2308 7.7037V11.8519C17.2295 12.9516 16.7752 14.006 15.9676 14.7836C15.1601 15.5613 14.0651 15.9987 12.9231 16Z"
				fill={userVote === 'upvoted' ? 'var(--upvote)' : '#666'}
			/>
		</svg>
	</button>
</div>

<style>
	.vote {
		display: flex;
		align-items: center;
		background-color: var(--grey-900);
		border: 1px solid var(--grey-900);
		border-radius: 8px;
		height: 44px;
	}

	b {
		font-family: 'Clash', sans-serif;
		font-size: var(--fs);
		line-height: var(--fs-lh);
		color: var(--grey-100);
		text-align: center;
		min-width: 2em;
	}

	b.downvote {
		color: var(--downvote);
	}

	b.upvote {
		color: var(--upvote);
	}

	button {
		display: flex;
		justify-content: center;
		align-items: center;
		transition: background-color 0.2s ease-in-out;
		padding: 0 0.75em;
		height: 100%;
	}

	button:first-child {
		border-radius: 8px 0 0 8px;
	}

	button:last-child {
		border-radius: 0 8px 8px 0;
	}
</style>